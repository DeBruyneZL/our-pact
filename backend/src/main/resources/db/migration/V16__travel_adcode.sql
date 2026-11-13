ALTER TABLE trip_spot
    ADD COLUMN adcode VARCHAR(12) DEFAULT NULL COMMENT '区县行政区划编码，如 510704' AFTER district,
    ADD COLUMN city_adcode VARCHAR(12) DEFAULT NULL COMMENT '城市行政区划编码，如 510700' AFTER adcode,
    ADD COLUMN province_adcode VARCHAR(12) DEFAULT NULL COMMENT '省份行政区划编码，如 510000' AFTER city_adcode;
