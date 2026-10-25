package com.kiven.lpp.ourpact.menu.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kiven.lpp.ourpact.common.BusinessException;
import com.kiven.lpp.ourpact.menu.dto.CategoryResponse;
import com.kiven.lpp.ourpact.menu.dto.CategorySaveRequest;
import com.kiven.lpp.ourpact.menu.dto.CategorySortRequest;
import com.kiven.lpp.ourpact.menu.entity.Dish;
import com.kiven.lpp.ourpact.menu.entity.DishCategory;
import com.kiven.lpp.ourpact.menu.mapper.DishCategoryMapper;
import com.kiven.lpp.ourpact.menu.mapper.DishMapper;
import com.kiven.lpp.ourpact.menu.service.DishCategoryService;
import com.kiven.lpp.ourpact.menu.service.MenuAccess;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 菜品分类的增删改查。
 *
 * @author zhangliang
 */
@Service
public class DishCategoryServiceImpl extends ServiceImpl<DishCategoryMapper, DishCategory> implements DishCategoryService {

    private final DishMapper dishMapper;

    private final MenuAccess menuAccess;

    public DishCategoryServiceImpl(DishMapper dishMapper, MenuAccess menuAccess) {
        this.dishMapper = dishMapper;
        this.menuAccess = menuAccess;
    }

    @Override
    public List<CategoryResponse> listAll() {
        return list(Wrappers.<DishCategory>lambdaQuery()
                .orderByAsc(DishCategory::getSortOrder)
                .orderByAsc(DishCategory::getId))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public CategoryResponse create(CategorySaveRequest request) {
        menuAccess.requireAdmin();
        String name = request.getName().trim();
        ensureNameFree(name, null);
        DishCategory category = new DishCategory();
        category.setName(name);
        category.setSortOrder(request.getSortOrder() == null ? nextSortOrder() : request.getSortOrder());
        save(category);
        return toResponse(category);
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public CategoryResponse update(Long id, CategorySaveRequest request) {
        menuAccess.requireAdmin();
        DishCategory category = requireCategory(id);
        String name = request.getName().trim();
        ensureNameFree(name, id);
        category.setName(name);
        if (request.getSortOrder() != null) {
            category.setSortOrder(request.getSortOrder());
        }
        updateById(category);
        return toResponse(category);
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public List<CategoryResponse> reorder(CategorySortRequest request) {
        menuAccess.requireAdmin();
        List<Long> ids = request.getIds();
        List<DishCategory> categories = list();
        if (ids.size() != categories.size() || new HashSet<>(ids).size() != ids.size()) {
            throw new BusinessException("分类顺序不完整");
        }
        Map<Long, DishCategory> byId = categories.stream()
                .collect(Collectors.toMap(DishCategory::getId, Function.identity()));
        if (!byId.keySet().containsAll(ids)) {
            throw new BusinessException("分类顺序不完整");
        }
        List<DishCategory> updates = new ArrayList<>();
        int sortOrder = 1;
        for (Long id : ids) {
            DishCategory category = byId.get(id);
            category.setSortOrder(sortOrder);
            updates.add(category);
            sortOrder++;
        }
        updateBatchById(updates);
        return listAll();
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public void delete(Long id) {
        menuAccess.requireAdmin();
        requireCategory(id);
        Long dishCount = dishMapper.selectCount(Wrappers.<Dish>lambdaQuery().eq(Dish::getCategoryId, id));
        if (dishCount != null && dishCount > 0) {
            throw new BusinessException("该分类下还有菜品，无法删除");
        }
        removeById(id);
    }

    private DishCategory requireCategory(Long id) {
        DishCategory category = getById(id);
        if (category == null) {
            throw new BusinessException("分类不存在");
        }
        return category;
    }

    private void ensureNameFree(String name, Long excludeId) {
        Long count = count(Wrappers.<DishCategory>lambdaQuery()
                .eq(DishCategory::getName, name)
                .ne(excludeId != null, DishCategory::getId, excludeId));
        if (count != null && count > 0) {
            throw new BusinessException("分类名称已存在");
        }
    }

    private int nextSortOrder() {
        DishCategory last = getOne(Wrappers.<DishCategory>lambdaQuery()
                .orderByDesc(DishCategory::getSortOrder)
                .last("limit 1"), false);
        if (last == null || last.getSortOrder() == null) {
            return 1;
        }
        return last.getSortOrder() + 1;
    }

    private CategoryResponse toResponse(DishCategory category) {
        CategoryResponse response = new CategoryResponse();
        response.setId(category.getId());
        response.setName(category.getName());
        response.setSortOrder(category.getSortOrder());
        return response;
    }
}
