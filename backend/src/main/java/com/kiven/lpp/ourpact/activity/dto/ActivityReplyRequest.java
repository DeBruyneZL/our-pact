package com.kiven.lpp.ourpact.activity.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 管理员答复。答复不是审批。
 *
 * @author zhangliang
 */
@Data
public class ActivityReplyRequest {

    @Size(max = 255, message = "答复不能超过 255 个字")
    private String replyNote;
}
