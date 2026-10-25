package com.kiven.lpp.ourpact.user.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kiven.lpp.ourpact.common.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * 微信小程序登录凭证校验（code2session）。只调微信接口，不落库。
 *
 * @author zhangliang
 */
@Service
public class WxAppClient {

    private static final String JSCODE_TO_SESSION_URL = "https://api.weixin.qq.com/sns/jscode2session";

    private final RestClient restClient = RestClient.create();

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String appId;

    private final String appSecret;

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
        if (!StringUtils.hasText(appId) || !StringUtils.hasText(appSecret)) {
            throw new BusinessException("服务端未配置微信小程序 app-id / app-secret");
        }
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
}
