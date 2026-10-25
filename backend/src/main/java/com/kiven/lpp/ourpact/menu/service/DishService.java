package com.kiven.lpp.ourpact.menu.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kiven.lpp.ourpact.menu.dto.DishResponse;
import com.kiven.lpp.ourpact.menu.dto.DishSaveRequest;
import com.kiven.lpp.ourpact.menu.entity.Dish;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 菜品及特殊项。
 *
 * @author zhangliang
 */
public interface DishService extends IService<Dish> {

    /**
     * 按分类和上架状态查询，并带上特殊项。
     */
    List<DishResponse> query(Boolean activeOnly, Long categoryId);

    /**
     * 新增菜品。
     */
    DishResponse create(DishSaveRequest request);

    /**
     * 修改菜品，特殊项按提交内容整体对齐。
     */
    DishResponse update(Long id, DishSaveRequest request);

    /**
     * 删除菜品及其特殊项、图片。
     */
    void delete(Long id);

    /**
     * 保存菜品图片，返回可访问路径。
     */
    String uploadImage(MultipartFile file);
}
