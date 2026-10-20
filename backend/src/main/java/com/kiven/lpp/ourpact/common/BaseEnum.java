package com.kiven.lpp.ourpact.common;

/**
 * 业务枚举约定。入库和接口传 value，展示用 desc。
 *
 * @param <T> 存储值类型
 * @author zhangliang
 */
public interface BaseEnum<T> {

    /**
     * 入库和接口使用的值。
     */
    T getValue();

    /**
     * 展示文案。
     */
    String getDesc();
}
