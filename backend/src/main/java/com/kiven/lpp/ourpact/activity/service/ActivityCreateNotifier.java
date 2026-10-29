package com.kiven.lpp.ourpact.activity.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.kiven.lpp.ourpact.activity.entity.Activity;
import com.kiven.lpp.ourpact.common.YesNo;
import com.kiven.lpp.ourpact.user.entity.User;
import com.kiven.lpp.ourpact.user.mapper.UserMapper;
import com.kiven.lpp.ourpact.user.service.WxAppClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 新活动创建后，向已授权的超级管理员推送「新活动发布提醒」。
 *
 * @author zhangliang
 */
@Slf4j
@Service
public class ActivityCreateNotifier {

    private static final int THING_MAX = 20;

    private static final DateTimeFormatter TIME_TEXT = DateTimeFormatter.ofPattern("yyyy年MM月dd日 HH:mm");

    /** 「新活动发布提醒」订阅消息模板 id（模板编号 432）。 */
    private static final String CREATE_TEMPLATE_ID = "RmvZNgaTHlDeXYC36srB21lYQRLVSEPLtSWgknfP3UE";

    private final UserMapper userMapper;

    private final WxAppClient wxAppClient;

    public ActivityCreateNotifier(UserMapper userMapper, WxAppClient wxAppClient) {
        this.userMapper = userMapper;
        this.wxAppClient = wxAppClient;
    }

    /**
     * 活动入库成功后调用。逐个超管推送，失败只记日志。
     *
     * @param activity 新建活动
     * @param publisherName 发布者显示名
     */
    public void notifyCreated(Activity activity, String publisherName) {
        List<User> admins = userMapper.selectList(Wrappers.<User>lambdaQuery()
                .eq(User::getSuperAdmin, YesNo.YES.getValue()));
        if (admins.isEmpty()) {
            return;
        }
        // 模板 432：thing1 发起方、thing4 活动地点、thing12 发布者、time18 发布时间
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("thing1", clip(activity.getName()));
        fields.put("thing4", clip(activity.getLocation()));
        fields.put("thing12", clip(publisherName));
        LocalDateTime publishedAt = activity.getCreateTime() == null ? LocalDateTime.now() : activity.getCreateTime();
        fields.put("time18", TIME_TEXT.format(publishedAt));
        String page = "pages/activity/detail?id=" + activity.getId();
        for (User admin : admins) {
            if (!StringUtils.hasText(admin.getWxOpenid())) {
                continue;
            }
            try {
                wxAppClient.sendSubscribeMessage(admin.getWxOpenid(), CREATE_TEMPLATE_ID, page, fields);
            } catch (Exception exception) {
                log.warn("新活动推送失败 userId={}：{}", admin.getId(), exception.getMessage());
            }
        }
    }

    private String clip(String value) {
        if (value == null) {
            return "";
        }
        return value.length() <= THING_MAX ? value : value.substring(0, THING_MAX);
    }
}
