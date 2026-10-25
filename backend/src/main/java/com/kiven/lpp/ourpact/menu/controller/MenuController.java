package com.kiven.lpp.ourpact.menu.controller;

import com.kiven.lpp.ourpact.common.Result;
import com.kiven.lpp.ourpact.menu.dto.CategoryResponse;
import com.kiven.lpp.ourpact.menu.dto.CategorySaveRequest;
import com.kiven.lpp.ourpact.menu.dto.CategorySortRequest;
import com.kiven.lpp.ourpact.menu.dto.DishImageResponse;
import com.kiven.lpp.ourpact.menu.dto.DishResponse;
import com.kiven.lpp.ourpact.menu.dto.DishSaveRequest;
import com.kiven.lpp.ourpact.menu.service.DishCategoryService;
import com.kiven.lpp.ourpact.menu.service.DishService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 菜单与分类接口。查询登录即可，写入仅超级管理员。
 *
 * @author zhangliang
 */
@RestController
@RequestMapping("/api/menu")
public class MenuController {

    private final DishCategoryService categoryService;

    private final DishService dishService;

    public MenuController(DishCategoryService categoryService, DishService dishService) {
        this.categoryService = categoryService;
        this.dishService = dishService;
    }

    /**
     * 全部分类，按排序返回。
     */
    @GetMapping("/categories")
    public Result<List<CategoryResponse>> categories() {
        return Result.success(categoryService.listAll());
    }

    /**
     * 新增分类。
     */
    @PostMapping("/categories")
    public Result<CategoryResponse> createCategory(@Valid @RequestBody CategorySaveRequest request) {
        return Result.success(categoryService.create(request));
    }

    /**
     * 按提交的主键顺序重排分类。
     */
    @PostMapping("/categories/sort")
    public Result<List<CategoryResponse>> sortCategories(@Valid @RequestBody CategorySortRequest request) {
        return Result.success(categoryService.reorder(request));
    }

    /**
     * 修改分类。
     */
    @PostMapping("/categories/{id}")
    public Result<CategoryResponse> updateCategory(@PathVariable Long id,
                                                   @Valid @RequestBody CategorySaveRequest request) {
        return Result.success(categoryService.update(id, request));
    }

    /**
     * 删除分类。
     */
    @PostMapping("/categories/{id}/delete")
    public Result<Void> deleteCategory(@PathVariable Long id) {
        categoryService.delete(id);
        return Result.success();
    }

    /**
     * 菜品列表。activeOnly 为 true 时只返回上架菜。
     */
    @GetMapping("/dishes")
    public Result<List<DishResponse>> dishes(@RequestParam(required = false) Boolean activeOnly,
                                             @RequestParam(required = false) Long categoryId) {
        return Result.success(dishService.query(activeOnly, categoryId));
    }

    /**
     * 新增菜品。
     */
    @PostMapping("/dishes")
    public Result<DishResponse> createDish(@Valid @RequestBody DishSaveRequest request) {
        return Result.success(dishService.create(request));
    }

    /**
     * 修改菜品。
     */
    @PostMapping("/dishes/{id}")
    public Result<DishResponse> updateDish(@PathVariable Long id, @Valid @RequestBody DishSaveRequest request) {
        return Result.success(dishService.update(id, request));
    }

    /**
     * 删除菜品。
     */
    @PostMapping("/dishes/{id}/delete")
    public Result<Void> deleteDish(@PathVariable Long id) {
        dishService.delete(id);
        return Result.success();
    }

    /**
     * 上传菜品图片，返回可写入菜品的访问路径。
     */
    @PostMapping("/dishes/image")
    public Result<DishImageResponse> uploadImage(@RequestParam("file") MultipartFile file) {
        DishImageResponse response = new DishImageResponse();
        response.setUrl(dishService.uploadImage(file));
        return Result.success(response);
    }
}
