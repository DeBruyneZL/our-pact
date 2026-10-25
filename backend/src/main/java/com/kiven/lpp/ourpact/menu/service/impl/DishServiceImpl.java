package com.kiven.lpp.ourpact.menu.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kiven.lpp.ourpact.common.BusinessException;
import com.kiven.lpp.ourpact.common.YesNo;
import com.kiven.lpp.ourpact.menu.dto.DishResponse;
import com.kiven.lpp.ourpact.menu.dto.DishSaveRequest;
import com.kiven.lpp.ourpact.menu.dto.OptionGroupRequest;
import com.kiven.lpp.ourpact.menu.dto.OptionGroupResponse;
import com.kiven.lpp.ourpact.menu.dto.OptionValueRequest;
import com.kiven.lpp.ourpact.menu.dto.OptionValueResponse;
import com.kiven.lpp.ourpact.menu.entity.Dish;
import com.kiven.lpp.ourpact.menu.entity.DishCategory;
import com.kiven.lpp.ourpact.menu.entity.DishOptionGroup;
import com.kiven.lpp.ourpact.menu.entity.DishOptionValue;
import com.kiven.lpp.ourpact.menu.mapper.DishMapper;
import com.kiven.lpp.ourpact.menu.service.DishCategoryService;
import com.kiven.lpp.ourpact.menu.service.DishImageStorage;
import com.kiven.lpp.ourpact.menu.service.DishOptionGroupService;
import com.kiven.lpp.ourpact.menu.service.DishOptionValueService;
import com.kiven.lpp.ourpact.menu.service.DishService;
import com.kiven.lpp.ourpact.menu.service.MenuAccess;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 菜品维护。特殊项随菜品一次保存，先查出再按主键对齐，避免逐条查询。
 *
 * @author zhangliang
 */
@Service
public class DishServiceImpl extends ServiceImpl<DishMapper, Dish> implements DishService {

    private final DishCategoryService categoryService;

    private final DishOptionGroupService groupService;

    private final DishOptionValueService valueService;

    private final DishImageStorage imageStorage;

    private final MenuAccess menuAccess;

    public DishServiceImpl(DishCategoryService categoryService,
                           DishOptionGroupService groupService,
                           DishOptionValueService valueService,
                           DishImageStorage imageStorage,
                           MenuAccess menuAccess) {
        this.categoryService = categoryService;
        this.groupService = groupService;
        this.valueService = valueService;
        this.imageStorage = imageStorage;
        this.menuAccess = menuAccess;
    }

    @Override
    public List<DishResponse> query(Boolean activeOnly, Long categoryId) {
        return assemble(list(Wrappers.<Dish>lambdaQuery()
                .eq(Boolean.TRUE.equals(activeOnly), Dish::getIsActive, YesNo.YES.getValue())
                .eq(categoryId != null, Dish::getCategoryId, categoryId)
                .orderByAsc(Dish::getSortOrder)
                .orderByAsc(Dish::getId)));
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public DishResponse create(DishSaveRequest request) {
        menuAccess.requireAdmin();
        requireCategory(request.getCategoryId());
        Dish dish = new Dish();
        fill(dish, request);
        save(dish);
        replaceOptions(dish.getId(), request.getOptionGroups());
        return requireResponse(dish.getId());
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public DishResponse update(Long id, DishSaveRequest request) {
        menuAccess.requireAdmin();
        Dish dish = getById(id);
        if (dish == null) {
            throw new BusinessException("菜品不存在");
        }
        requireCategory(request.getCategoryId());
        fill(dish, request);
        updateById(dish);
        replaceOptions(id, request.getOptionGroups());
        return requireResponse(id);
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public void delete(Long id) {
        menuAccess.requireAdmin();
        Dish dish = getById(id);
        if (dish == null) {
            throw new BusinessException("菜品不存在");
        }
        List<Long> groupIds = groupService.list(Wrappers.<DishOptionGroup>lambdaQuery()
                        .eq(DishOptionGroup::getDishId, id))
                .stream()
                .map(DishOptionGroup::getId)
                .toList();
        if (!groupIds.isEmpty()) {
            valueService.remove(Wrappers.<DishOptionValue>lambdaQuery().in(DishOptionValue::getGroupId, groupIds));
            groupService.removeByIds(groupIds);
        }
        removeById(id);
        imageStorage.delete(dish.getImageName());
    }

    @Override
    public String uploadImage(MultipartFile file) {
        menuAccess.requireAdmin();
        return imageStorage.url(imageStorage.save(file));
    }

    private void fill(Dish dish, DishSaveRequest request) {
        dish.setCategoryId(request.getCategoryId());
        dish.setName(request.getName().trim());
        dish.setDescription(request.getDescription() == null ? "" : request.getDescription().trim());
        dish.setSortOrder(request.getSortOrder() == null ? 0 : request.getSortOrder());
        dish.setIsActive(Boolean.FALSE.equals(request.getIsActive()) ? YesNo.NO.getValue() : YesNo.YES.getValue());
        dish.setImageName(resolveImage(dish.getImageName(), request.getImageUrl()));
    }

    private String resolveImage(String currentName, String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            imageStorage.delete(currentName);
            return null;
        }
        String name = imageStorage.storedName(imageUrl.trim());
        if (name == null) {
            throw new BusinessException("菜品图片无效，请重新上传");
        }
        if (currentName != null && !currentName.equals(name)) {
            imageStorage.delete(currentName);
        }
        return name;
    }

    private void requireCategory(Long categoryId) {
        DishCategory category = categoryService.getById(categoryId);
        if (category == null) {
            throw new BusinessException("请选择分类");
        }
    }

    private DishResponse requireResponse(Long id) {
        List<DishResponse> responses = assemble(List.of(getById(id)));
        return responses.get(0);
    }

    private List<DishResponse> assemble(List<Dish> dishes) {
        if (dishes == null || dishes.isEmpty() || dishes.get(0) == null) {
            return List.of();
        }
        List<Long> dishIds = dishes.stream().map(Dish::getId).toList();
        List<DishOptionGroup> groups = groupService.list(Wrappers.<DishOptionGroup>lambdaQuery()
                .in(DishOptionGroup::getDishId, dishIds)
                .orderByAsc(DishOptionGroup::getSortOrder)
                .orderByAsc(DishOptionGroup::getId));
        List<Long> groupIds = groups.stream().map(DishOptionGroup::getId).toList();
        List<DishOptionValue> values = groupIds.isEmpty()
                ? List.of()
                : valueService.list(Wrappers.<DishOptionValue>lambdaQuery()
                .in(DishOptionValue::getGroupId, groupIds)
                .orderByAsc(DishOptionValue::getSortOrder)
                .orderByAsc(DishOptionValue::getId));

        Map<Long, List<OptionValueResponse>> valuesByGroup = new HashMap<>();
        for (DishOptionValue value : values) {
            OptionValueResponse response = new OptionValueResponse();
            response.setId(value.getId());
            response.setLabel(value.getLabel());
            response.setSortOrder(value.getSortOrder());
            valuesByGroup.computeIfAbsent(value.getGroupId(), key -> new ArrayList<>()).add(response);
        }
        Map<Long, List<OptionGroupResponse>> groupsByDish = new HashMap<>();
        for (DishOptionGroup group : groups) {
            OptionGroupResponse response = new OptionGroupResponse();
            response.setId(group.getId());
            response.setName(group.getName());
            response.setSortOrder(group.getSortOrder());
            response.setValues(valuesByGroup.getOrDefault(group.getId(), List.of()));
            groupsByDish.computeIfAbsent(group.getDishId(), key -> new ArrayList<>()).add(response);
        }

        List<DishResponse> responses = new ArrayList<>();
        for (Dish dish : dishes) {
            DishResponse response = new DishResponse();
            response.setId(dish.getId());
            response.setCategoryId(dish.getCategoryId());
            response.setName(dish.getName());
            response.setDescription(dish.getDescription());
            response.setImageUrl(imageStorage.url(dish.getImageName()));
            response.setIsActive(YesNo.YES.getValue().equals(dish.getIsActive()));
            response.setSortOrder(dish.getSortOrder());
            response.setCreatedAt(dish.getCreateTime());
            response.setUpdatedAt(dish.getUpdateTime());
            response.setOptionGroups(groupsByDish.getOrDefault(dish.getId(), List.of()));
            responses.add(response);
        }
        return responses;
    }

    private void replaceOptions(Long dishId, List<OptionGroupRequest> requests) {
        List<OptionGroupRequest> incoming = requests == null ? List.of() : requests;
        List<DishOptionGroup> existingGroups = groupService.list(Wrappers.<DishOptionGroup>lambdaQuery()
                .eq(DishOptionGroup::getDishId, dishId));
        Map<Long, DishOptionGroup> groupById = new HashMap<>();
        for (DishOptionGroup group : existingGroups) {
            groupById.put(group.getId(), group);
        }
        List<Long> existingGroupIds = existingGroups.stream().map(DishOptionGroup::getId).toList();
        Map<Long, DishOptionValue> valueById = new HashMap<>();
        if (!existingGroupIds.isEmpty()) {
            for (DishOptionValue value : valueService.list(Wrappers.<DishOptionValue>lambdaQuery()
                    .in(DishOptionValue::getGroupId, existingGroupIds))) {
                valueById.put(value.getId(), value);
            }
        }

        List<DishOptionGroup> groupUpdates = new ArrayList<>();
        List<DishOptionGroup> groupInserts = new ArrayList<>();
        List<OptionGroupRequest> insertRequests = new ArrayList<>();
        List<GroupBind> kept = new ArrayList<>();
        Set<Long> keepGroupIds = new HashSet<>();
        int groupSort = 0;
        for (OptionGroupRequest request : incoming) {
            DishOptionGroup group = request.getId() == null ? null : groupById.get(request.getId());
            if (group == null) {
                group = new DishOptionGroup();
                group.setDishId(dishId);
                group.setName(request.getName().trim());
                group.setSortOrder(groupSort);
                groupInserts.add(group);
                insertRequests.add(request);
            } else {
                group.setName(request.getName().trim());
                group.setSortOrder(groupSort);
                groupUpdates.add(group);
                keepGroupIds.add(group.getId());
                kept.add(new GroupBind(request, group));
            }
            groupSort++;
        }
        List<Long> removeGroupIds = existingGroupIds.stream().filter(id -> !keepGroupIds.contains(id)).toList();
        if (!removeGroupIds.isEmpty()) {
            valueService.remove(Wrappers.<DishOptionValue>lambdaQuery().in(DishOptionValue::getGroupId, removeGroupIds));
            groupService.removeByIds(removeGroupIds);
        }
        if (!groupUpdates.isEmpty()) {
            groupService.updateBatchById(groupUpdates);
        }
        if (!groupInserts.isEmpty()) {
            groupService.saveBatch(groupInserts);
            for (int i = 0; i < groupInserts.size(); i++) {
                kept.add(new GroupBind(insertRequests.get(i), groupInserts.get(i)));
            }
        }
        syncValues(kept, valueById);
    }

    private void syncValues(List<GroupBind> groups, Map<Long, DishOptionValue> valueById) {
        List<DishOptionValue> valueUpdates = new ArrayList<>();
        List<DishOptionValue> valueInserts = new ArrayList<>();
        Set<Long> keepValueIds = new HashSet<>();
        for (GroupBind bind : groups) {
            int valueSort = 0;
            for (OptionValueRequest request : bind.request.getValues()) {
                DishOptionValue value = request.getId() == null ? null : valueById.get(request.getId());
                if (value == null || !bind.group.getId().equals(value.getGroupId())) {
                    value = new DishOptionValue();
                    value.setGroupId(bind.group.getId());
                    value.setLabel(request.getLabel().trim());
                    value.setSortOrder(valueSort);
                    valueInserts.add(value);
                } else {
                    value.setLabel(request.getLabel().trim());
                    value.setSortOrder(valueSort);
                    valueUpdates.add(value);
                    keepValueIds.add(value.getId());
                }
                valueSort++;
            }
        }
        List<Long> removeValueIds = valueById.keySet().stream().filter(id -> !keepValueIds.contains(id)).toList();
        if (!removeValueIds.isEmpty()) {
            valueService.removeByIds(removeValueIds);
        }
        if (!valueUpdates.isEmpty()) {
            valueService.updateBatchById(valueUpdates);
        }
        if (!valueInserts.isEmpty()) {
            valueService.saveBatch(valueInserts);
        }
    }

    private static final class GroupBind {

        private final OptionGroupRequest request;

        private final DishOptionGroup group;

        private GroupBind(OptionGroupRequest request, DishOptionGroup group) {
            this.request = request;
            this.group = group;
        }
    }
}
