package com.kiven.lpp.ourpact.activity.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.kiven.lpp.ourpact.activity.entity.Activity;
import com.kiven.lpp.ourpact.activity.entity.ActivityParticipant;
import com.kiven.lpp.ourpact.activity.mapper.ActivityParticipantMapper;
import com.kiven.lpp.ourpact.user.entity.User;
import com.kiven.lpp.ourpact.user.mapper.UserMapper;
import com.kiven.lpp.ourpact.user.service.WxAppClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 活动撤回时的微信订阅消息推送。
 * 参与人先在小程序里点过订阅授权，撤回时才能收到一条服务通知；没授权的跳过。
 *
 * @author zhangliang
 */
@Slf4j
@Service
public class ActivityCancelNotifier {

    /** 微信 thing 类型字段最长 20 字。 */
    private static final int THING_MAX = 20;

    /** 微信 date 类型展示格式。 */
    private static final DateTimeFormatter TIME_TEXT = DateTimeFormatter.ofPattern("yyyy年MM月dd日 HH:mm");

    /** 「活动取消通知」订阅消息模板 id（模板编号 1104）。 */
    private static final String CANCEL_TEMPLATE_ID = "px4ixul8SRHEkuCkC3bHmoS8o08waXztZsPrXf1A2KA";

    private final ActivityParticipantMapper participantMapper;

    private final UserMapper userMapper;

    private final WxAppClient wxAppClient;

    public ActivityCancelNotifier(
            ActivityParticipantMapper participantMapper,
            UserMapper userMapper,
            WxAppClient wxAppClient) {
        this.participantMapper = participantMapper;
        this.userMapper = userMapper;
        this.wxAppClient = wxAppClient;
    }

    /**
     * 撤回提交成功后调用。逐个参与人推送，失败只记日志，不影响撤回本身。
     *
     * @param activity 已撤回的活动
     * @param initiatorName 发起人显示名
     */
    public void notifyWithdrawn(Activity activity, String initiatorName) {
        List<Long> userIds = participantMapper.selectList(Wrappers.<ActivityParticipant>lambdaQuery()
                        .eq(ActivityParticipant::getActivityId, activity.getId()))
                .stream()
                .map(ActivityParticipant::getUserId)
                .distinct()
                .toList();
        if (userIds.isEmpty()) {
            return;
        }
        List<User> participants = userMapper.selectBatchIds(userIds);
        // 模板「活动取消通知」1104 的字段：thing1 活动名称、date2 活动时间、thing13 发起人
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("thing1", clip(activity.getName()));
        fields.put("date2", activity.getScheduledAt() == null ? "" : TIME_TEXT.format(activity.getScheduledAt()));
        fields.put("thing13", clip(initiatorName));
        String page = "pages/activity/detail?id=" + activity.getId();
        for (User participant : participants) {
            if (!StringUtils.hasText(participant.getWxOpenid())) {
                continue;
            }
            try {
                wxAppClient.sendSubscribeMessage(participant.getWxOpenid(), CANCEL_TEMPLATE_ID, page, fields);
            } catch (Exception exception) {
                log.warn("撤回推送失败 userId={}：{}", participant.getId(), exception.getMessage());
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
