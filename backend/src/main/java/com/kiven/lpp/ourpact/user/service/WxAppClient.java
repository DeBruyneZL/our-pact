package com.kiven.lpp.ourpact.user.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kiven.lpp.ourpact.common.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

/**
 * 微信小程序服务端接口：code2session、access_token、订阅消息。
 *
 * @author zhangliang
 */
@Service
public class WxAppClient {

    private static final String JSCODE_TO_SESSION_URL = "https://api.weixin.qq.com/sns/jscode2session";

    private static final String TOKEN_URL = "https://api.weixin.qq.com/cgi-bin/token";

    private static final String SUBSCRIBE_SEND_URL = "https://api.weixin.qq.com/cgi-bin/message/subscribe/send";

    /** 43101：用户未点过订阅授权，或授权次数已用完，属正常情况。 */
    private static final int ERRCODE_NOT_SUBSCRIBED = 43101;

    /** access_token 失效。 */
    private static final int ERRCODE_TOKEN_INVALID = 40001;

    /** access_token 过期。 */
    private static final int ERRCODE_TOKEN_EXPIRED = 42001;

    private final RestClient restClient = RestClient.create();

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String appId;

    private final String appSecret;

    /** access_token 缓存。微信有效期 7200 秒，提前 300 秒刷新。 */
    private volatile String cachedToken;

    private volatile long cachedTokenExpiresAt;

    public WxAppClient(
            @Value("${app.wxapp.app-id:}") String appId,
            @Value("${app.wxapp.app-secret:}") String appSecret) {
        this.appId = appId;
        this.appSecret = appSecret;
    }

    /**
     * 用小程序端 wx.login 拿到的临时 code 换取用户 openid。
     *
     * @param code 一次性登录凭证
     * @return openid
     */
    public String getOpenid(String code) {
        requireAppConfigured();
        // 微信返回 JSON 但 Content-Type 是 text/plain，转换器不认，按字符串接收后手动解析
        String raw = restClient.get()
                .uri(JSCODE_TO_SESSION_URL + "?appid={appId}&secret={secret}&js_code={code}&grant_type=authorization_code",
                        appId, appSecret, code)
                .retrieve()
                .body(String.class);
        Map<?, ?> body;
        try {
            body = objectMapper.readValue(raw, Map.class);
        } catch (JsonProcessingException exception) {
            throw new BusinessException("微信登录失败：响应解析异常");
        }
        Object openid = body == null ? null : body.get("openid");
        if (openid == null) {
            Object errmsg = body.get("errmsg");
            throw new BusinessException("微信登录失败：" + (errmsg == null ? "未返回 openid" : errmsg));
        }
        return String.valueOf(openid);
    }

    /**
     * 小程序接口调用凭据。单实例内存缓存，过期自动刷新。
     *
     * @return access_token
     */
    public String getAccessToken() {
        requireAppConfigured();
        long now = System.currentTimeMillis();
        String token = cachedToken;
        if (token != null && now < cachedTokenExpiresAt) {
            return token;
        }
        String raw = restClient.get()
                .uri(TOKEN_URL + "?grant_type=client_credential&appid={appId}&secret={secret}", appId, appSecret)
                .retrieve()
                .body(String.class);
        Map<?, ?> body;
        try {
            body = objectMapper.readValue(raw, Map.class);
        } catch (JsonProcessingException exception) {
            throw new BusinessException("获取微信接口凭据失败：响应解析异常");
        }
        Object value = body == null ? null : body.get("access_token");
        if (value == null) {
            throw new BusinessException("获取微信接口凭据失败：" + errorText(body));
        }
        Object expiresIn = body.get("expires_in");
        long seconds = expiresIn instanceof Number ? ((Number) expiresIn).longValue() : 7200;
        cachedToken = String.valueOf(value);
        cachedTokenExpiresAt = now + Math.max(60, seconds - 300) * 1000;
        return cachedToken;
    }

    /**
     * 发送订阅消息。必须由用户先在小程序里点过对应模板的授权。
     *
     * @param openid 收件人 openid
     * @param templateId 模板 id
     * @param page 点击消息跳转的小程序页面，如 pages/activity/detail?id=1
     * @param fields 模板字段，key 是模板里的字段名（thing1、time2 等），value 是内容
     * @return 用户已订阅且发送成功返回 true；用户未订阅返回 false
     */
    public boolean sendSubscribeMessage(String openid, String templateId, String page, Map<String, String> fields) {
        Map<String, Object> data = new HashMap<>();
        for (Map.Entry<String, String> entry : fields.entrySet()) {
            data.put(entry.getKey(), Map.of("value", entry.getValue()));
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("touser", openid);
        payload.put("template_id", templateId);
        if (StringUtils.hasText(page)) {
            payload.put("page", page);
        }
        payload.put("data", data);
        String body;
        try {
            body = objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            throw new BusinessException("订阅消息发送失败：请求组装异常");
        }
        String raw = restClient.post()
                .uri(SUBSCRIBE_SEND_URL + "?access_token={token}", getAccessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);
        Map<?, ?> result;
        try {
            result = objectMapper.readValue(raw == null ? "{}" : raw, Map.class);
        } catch (JsonProcessingException exception) {
            throw new BusinessException("订阅消息发送失败：响应解析异常");
        }
        Object errcode = result == null ? null : result.get("errcode");
        int code = errcode instanceof Number ? ((Number) errcode).intValue() : 0;
        if (code == 0) {
            return true;
        }
        if (code == ERRCODE_NOT_SUBSCRIBED) {
            return false;
        }
        if (code == ERRCODE_TOKEN_INVALID || code == ERRCODE_TOKEN_EXPIRED) {
            // 凭据失效，清缓存后下次重新获取
            cachedToken = null;
        }
        throw new BusinessException("订阅消息发送失败：" + errorText(result));
    }

    private void requireAppConfigured() {
        if (!StringUtils.hasText(appId) || !StringUtils.hasText(appSecret)) {
            throw new BusinessException("服务端未配置微信小程序 app-id / app-secret");
        }
    }

    private String errorText(Map<?, ?> body) {
        Object errmsg = body == null ? null : body.get("errmsg");
        Object errcode = body == null ? null : body.get("errcode");
        if (errmsg == null) {
            return "未知错误";
        }
        return errcode + " " + errmsg;
    }
}
