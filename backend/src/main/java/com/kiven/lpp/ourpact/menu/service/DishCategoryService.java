package com.kiven.lpp.ourpact.menu.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kiven.lpp.ourpact.menu.dto.CategoryResponse;
import com.kiven.lpp.ourpact.menu.dto.CategorySaveRequest;
import com.kiven.lpp.ourpact.menu.dto.CategorySortRequest;
import com.kiven.lpp.ourpact.menu.entity.DishCategory;

import java.util.List;

/**
 * 菜品分类。
 *
 * @author zhangliang
 */
public interface DishCategoryService extends IService<DishCategory> {

    /**
     * 按排序返回全部分类。
     */
    List<CategoryResponse> listAll();

    /**
     * 新增分类。同名分类不可重复。
     */
    CategoryResponse create(CategorySaveRequest request);

    /**
     * 修改分类名称或排序。
     */
    CategoryResponse update(Long id, CategorySaveRequest request);

    /**
     * 按给定主键顺序重排。必须包含全部分类，且不能重复。
     */
    List<CategoryResponse> reorder(CategorySortRequest request);

    /**
     * 删除分类。分类下还有菜品时拒绝。
     */
    void delete(Long id);
}
