package com.kiven.lpp.ourpact.user.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.kiven.lpp.ourpact.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 用户实体示例，对应表 sys_user。
 *
 * @author zhangliang
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_user")
public class User extends BaseEntity {

    private String username;

    private String phone;

    private String password;

    private String nickname;

    private String avatar;

    /** 取值见 {@link com.kiven.lpp.ourpact.common.YesNo} */
    private Integer superAdmin;
}
