package com.kiven.lpp.ourpact.menu.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * 特殊项对外结构。
 *
 * @author zhangliang
 */
@Data
public class OptionGroupResponse {

    private Long id;

    private String name;

    private Integer sortOrder;

    private List<OptionValueResponse> values = new ArrayList<>();
}
