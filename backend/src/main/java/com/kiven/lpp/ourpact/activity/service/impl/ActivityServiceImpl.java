package com.kiven.lpp.ourpact.activity.service.impl;

import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.kiven.lpp.ourpact.activity.ActivityNoticeType;
import com.kiven.lpp.ourpact.activity.ActivityStatus;
import com.kiven.lpp.ourpact.activity.dto.ActivityItemRequest;
import com.kiven.lpp.ourpact.activity.dto.ActivityItemResponse;
import com.kiven.lpp.ourpact.activity.dto.ActivityItemsRequest;
import com.kiven.lpp.ourpact.activity.dto.ActivityJoinRequest;
import com.kiven.lpp.ourpact.activity.dto.ActivityNoticeResponse;
import com.kiven.lpp.ourpact.activity.dto.ActivityOptionRequest;
import com.kiven.lpp.ourpact.activity.dto.ActivityOptionResponse;
import com.kiven.lpp.ourpact.activity.dto.ActivityPageQuery;
import com.kiven.lpp.ourpact.activity.dto.ActivityParticipantResponse;
import com.kiven.lpp.ourpact.activity.dto.ActivityPhotoResponse;
import com.kiven.lpp.ourpact.activity.dto.ActivityReplyRequest;
import com.kiven.lpp.ourpact.activity.dto.ActivityResponse;
import com.kiven.lpp.ourpact.activity.dto.ActivitySaveRequest;
import com.kiven.lpp.ourpact.activity.dto.ActivityUpdateRequest;
import com.kiven.lpp.ourpact.activity.entity.Activity;
import com.kiven.lpp.ourpact.activity.entity.ActivityItem;
import com.kiven.lpp.ourpact.activity.entity.ActivityItemOption;
import com.kiven.lpp.ourpact.activity.entity.ActivityNotice;
import com.kiven.lpp.ourpact.activity.entity.ActivityParticipant;
import com.kiven.lpp.ourpact.activity.entity.ActivityPhoto;
import com.kiven.lpp.ourpact.activity.mapper.ActivityItemOptionMapper;
import com.kiven.lpp.ourpact.activity.mapper.ActivityMapper;
import com.kiven.lpp.ourpact.activity.mapper.ActivityNoticeMapper;
import com.kiven.lpp.ourpact.activity.mapper.ActivityParticipantMapper;
import com.kiven.lpp.ourpact.activity.mapper.ActivityPhotoMapper;
import com.kiven.lpp.ourpact.activity.service.ActivityItemOptionService;
import com.kiven.lpp.ourpact.activity.service.ActivityItemService;
import com.kiven.lpp.ourpact.activity.service.ActivityPhotoStorage;
import com.kiven.lpp.ourpact.activity.service.ActivityService;
import com.kiven.lpp.ourpact.common.BusinessException;
import com.kiven.lpp.ourpact.common.PageResult;
import com.kiven.lpp.ourpact.common.PageUtil;
import com.kiven.lpp.ourpact.common.YesNo;
import com.kiven.lpp.ourpact.menu.entity.Dish;
import com.kiven.lpp.ourpact.menu.entity.DishOptionGroup;
import com.kiven.lpp.ourpact.menu.entity.DishOptionValue;
import com.kiven.lpp.ourpact.menu.mapper.DishMapper;
import com.kiven.lpp.ourpact.menu.mapper.DishOptionGroupMapper;
import com.kiven.lpp.ourpact.menu.mapper.DishOptionValueMapper;
import com.kiven.lpp.ourpact.menu.service.DishImageStorage;
import com.kiven.lpp.ourpact.user.entity.User;
import com.kiven.lpp.ourpact.user.mapper.UserMapper;
import com.kiven.lpp.ourpact.user.service.AvatarStorage;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 活动规则：只能删自己加的菜；待答复和已答复都可以删。答复后不能改名称、时间和地点。撤回通知管理员。
 *
 * @author zhangliang
 */
@Service
public class ActivityServiceImpl implements ActivityService {

    private static final int SHARE_CODE_LENGTH = 6;

    private static final int MAX_ITEM_COUNT = 50;

    private static final int MAX_PHOTO_COUNT = 20;

    private static final String SHARE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final ActivityMapper activityMapper;

    private final ActivityParticipantMapper participantMapper;

    private final ActivityNoticeMapper noticeMapper;

    private final ActivityPhotoMapper photoMapper;

    private final ActivityItemOptionMapper optionMapper;

    private final ActivityItemService itemService;

    private final ActivityItemOptionService optionService;

    private final ActivityPhotoStorage photoStorage;

    private final UserMapper userMapper;

    private final DishMapper dishMapper;

    private final DishOptionGroupMapper dishOptionGroupMapper;

    private final DishOptionValueMapper dishOptionValueMapper;

    private final DishImageStorage dishImageStorage;

    private final AvatarStorage avatarStorage;

    private final SecureRandom random = new SecureRandom();

    public ActivityServiceImpl(ActivityMapper activityMapper,
                               ActivityParticipantMapper participantMapper,
                               ActivityNoticeMapper noticeMapper,
                               ActivityPhotoMapper photoMapper,
                               ActivityItemOptionMapper optionMapper,
                               ActivityItemService itemService,
                               ActivityItemOptionService optionService,
                               ActivityPhotoStorage photoStorage,
                               UserMapper userMapper,
                               DishMapper dishMapper,
                               DishOptionGroupMapper dishOptionGroupMapper,
                               DishOptionValueMapper dishOptionValueMapper,
                               DishImageStorage dishImageStorage,
                               AvatarStorage avatarStorage) {
        this.activityMapper = activityMapper;
        this.participantMapper = participantMapper;
        this.noticeMapper = noticeMapper;
        this.photoMapper = photoMapper;
        this.optionMapper = optionMapper;
        this.itemService = itemService;
        this.optionService = optionService;
        this.photoStorage = photoStorage;
        this.userMapper = userMapper;
        this.dishMapper = dishMapper;
        this.dishOptionGroupMapper = dishOptionGroupMapper;
        this.dishOptionValueMapper = dishOptionValueMapper;
        this.dishImageStorage = dishImageStorage;
        this.avatarStorage = avatarStorage;
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public ActivityResponse add(ActivitySaveRequest request) {
        long userId = currentUserId();
        User initiator = requireUniqueName(userId);
        Activity activity = new Activity();
        activity.setName(resolveName(request.getName(), initiator, request.getScheduledAt()));
        activity.setScheduledAt(request.getScheduledAt());
        activity.setLocation(request.getLocation().trim());
        activity.setUserId(userId);
        activity.setPeopleCount(normalizePeopleCount(request.getPeopleCount()));
        activity.setStatus(ActivityStatus.OPEN.getValue());
        insertWithShareCode(activity);
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            saveItems(activity.getId(), userId, request.getItems());
        }
        return loadDetail(activity.getId(), userId);
    }

    @Override
    public PageResult<ActivityResponse> page(ActivityPageQuery query) {
        long userId = currentUserId();
        ActivityPageQuery safe = prepareQuery(query);
        safe.setUserId(userId);
        Page<Activity> raw = activityMapper.queryMine(PageUtil.toPage(safe), safe);
        return toPage(raw, userId);
    }

    @Override
    public PageResult<ActivityResponse> managePage(ActivityPageQuery query) {
        requireAdmin();
        long userId = currentUserId();
        ActivityPageQuery safe = prepareQuery(query);
        Page<Activity> raw = activityMapper.queryManage(PageUtil.toPage(safe), safe);
        return toPage(raw, userId);
    }

    @Override
    public ActivityResponse detail(Long id) {
        long userId = currentUserId();
        Activity activity = requireActivity(id);
        boolean admin = isAdmin(userId);
        if (!admin && !isMember(activity, userId)) {
            throw new BusinessException("你还没有加入这个活动");
        }
        return loadDetail(id, userId);
    }

    @Override
    public ActivityResponse detailByCode(String shareCode) {
        Activity activity = requireByCode(shareCode);
        return loadDetail(activity.getId(), currentUserId());
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public ActivityResponse join(String shareCode, ActivityJoinRequest request) {
        long userId = currentUserId();
        requireUniqueName(userId);
        Activity activity = requireByCode(shareCode);
        if (activity.getUserId().equals(userId) || isMember(activity, userId)) {
            return loadDetail(activity.getId(), userId);
        }
        if (!canAcceptMember(activity)) {
            throw new BusinessException(closedMessage(activity));
        }
        ActivityParticipant participant = new ActivityParticipant();
        participant.setActivityId(activity.getId());
        participant.setUserId(userId);
        participant.setPeopleCount(normalizePeopleCount(request.getPeopleCount()));
        try {
            participantMapper.insert(participant);
        } catch (DuplicateKeyException exception) {
            return loadDetail(activity.getId(), userId);
        }
        return loadDetail(activity.getId(), userId);
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public ActivityResponse update(Long id, ActivityUpdateRequest request) {
        long userId = currentUserId();
        Activity activity = requireActivity(id);
        if (!activity.getUserId().equals(userId)) {
            throw new BusinessException("只有发起人可以修改活动");
        }
        int changed = activityMapper.update(null, Wrappers.<Activity>lambdaUpdate()
                .eq(Activity::getId, id)
                .eq(Activity::getStatus, ActivityStatus.OPEN.getValue())
                .set(Activity::getName, request.getName().trim())
                .set(Activity::getScheduledAt, request.getScheduledAt())
                .set(Activity::getLocation, request.getLocation().trim()));
        if (changed == 0) {
            throw new BusinessException("答复后不能再修改活动");
        }
        return loadDetail(id, userId);
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public ActivityResponse addItems(Long id, ActivityItemsRequest request) {
        long userId = currentUserId();
        requireUniqueName(userId);
        Activity activity = requireActivity(id);
        if (!isMember(activity, userId)) {
            throw new BusinessException("加入活动后才能加菜");
        }
        if (!canAcceptMember(activity)) {
            throw new BusinessException(closedMessage(activity));
        }
        Long existing = itemService.count(Wrappers.<ActivityItem>lambdaQuery().eq(ActivityItem::getActivityId, id));
        int current = existing == null ? 0 : existing.intValue();
        if (current + request.getItems().size() > MAX_ITEM_COUNT) {
            throw new BusinessException("这个活动的菜已经够多了");
        }
        int changed = activityMapper.update(null, Wrappers.<Activity>lambdaUpdate()
                .eq(Activity::getId, id)
                .in(Activity::getStatus, ActivityStatus.OPEN.getValue(), ActivityStatus.REPLIED.getValue())
                .set(Activity::getUpdateTime, LocalDateTime.now()));
        if (changed == 0) {
            throw new BusinessException("现在不能再加菜");
        }
        saveItems(id, userId, request.getItems());
        return loadDetail(id, userId);
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public ActivityResponse deleteItem(Long id, Long itemId) {
        long userId = currentUserId();
        Activity activity = requireActivity(id);
        if (!canAcceptMember(activity)) {
            throw new BusinessException(closedMessage(activity));
        }
        ActivityItem item = itemService.getById(itemId);
        if (item == null || !id.equals(item.getActivityId())) {
            throw new BusinessException("这道菜不在活动里");
        }
        if (!Objects.equals(item.getAddedByUserId(), userId)) {
            throw new BusinessException("只能删除自己加的菜");
        }
        optionMapper.delete(Wrappers.<ActivityItemOption>lambdaQuery().eq(ActivityItemOption::getItemId, itemId));
        itemService.removeById(itemId);
        return loadDetail(id, userId);
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public ActivityResponse withdraw(Long id) {
        long userId = currentUserId();
        Activity activity = requireActivity(id);
        if (!activity.getUserId().equals(userId)) {
            throw new BusinessException("只有发起人可以撤回");
        }
        LocalDateTime now = LocalDateTime.now();
        int changed = activityMapper.update(null, Wrappers.<Activity>lambdaUpdate()
                .eq(Activity::getId, id)
                .in(Activity::getStatus, ActivityStatus.OPEN.getValue(), ActivityStatus.REPLIED.getValue())
                .set(Activity::getStatus, ActivityStatus.WITHDRAWN.getValue())
                .set(Activity::getWithdrawnAt, now));
        if (changed == 0) {
            throw new BusinessException("已完成的活动不能撤回");
        }
        User user = userMapper.selectById(userId);
        ActivityNotice notice = new ActivityNotice();
        notice.setActivityId(id);
        notice.setType(ActivityNoticeType.WITHDRAWN.getValue());
        notice.setMessage(displayName(user) + "撤回了活动「" + activity.getName() + "」");
        notice.setReadFlag(YesNo.NO.getValue());
        noticeMapper.insert(notice);
        return loadDetail(id, userId);
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public ActivityResponse complete(Long id) {
        long userId = currentUserId();
        Activity activity = requireActivity(id);
        if (!activity.getUserId().equals(userId)) {
            throw new BusinessException("只有发起人可以完成活动");
        }
        int changed = activityMapper.update(null, Wrappers.<Activity>lambdaUpdate()
                .eq(Activity::getId, id)
                .in(Activity::getStatus, ActivityStatus.OPEN.getValue(), ActivityStatus.REPLIED.getValue())
                .set(Activity::getStatus, ActivityStatus.COMPLETED.getValue())
                .set(Activity::getCompletedAt, LocalDateTime.now()));
        if (changed == 0) {
            throw new BusinessException("这个活动不能再标记完成");
        }
        return loadDetail(id, userId);
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public ActivityResponse reply(Long id, ActivityReplyRequest request) {
        requireAdmin();
        long userId = currentUserId();
        requireActivity(id);
        String note = request == null || request.getReplyNote() == null ? null : blankToNull(request.getReplyNote());
        int changed = activityMapper.update(null, Wrappers.<Activity>lambdaUpdate()
                .eq(Activity::getId, id)
                .eq(Activity::getStatus, ActivityStatus.OPEN.getValue())
                .set(Activity::getStatus, ActivityStatus.REPLIED.getValue())
                .set(Activity::getReplyNote, note)
                .set(Activity::getRepliedAt, LocalDateTime.now()));
        if (changed == 0) {
            throw new BusinessException("这个活动现在不能答复");
        }
        return loadDetail(id, userId);
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public ActivityResponse uploadPhoto(Long id, MultipartFile file) {
        long userId = currentUserId();
        requireUniqueName(userId);
        Activity activity = requireActivity(id);
        if (!ActivityStatus.COMPLETED.getValue().equals(activity.getStatus())) {
            throw new BusinessException("活动完成后才能上传照片");
        }
        if (!isMember(activity, userId)) {
            throw new BusinessException("只有参与人可以上传照片");
        }
        Long existing = photoMapper.selectCount(Wrappers.<ActivityPhoto>lambdaQuery().eq(ActivityPhoto::getActivityId, id));
        if (existing != null && existing >= MAX_PHOTO_COUNT) {
            throw new BusinessException("最多上传 20 张照片");
        }
        String storedName = photoStorage.save(file);
        ActivityPhoto photo = new ActivityPhoto();
        photo.setActivityId(id);
        photo.setUserId(userId);
        photo.setFileName(storedName);
        try {
            photoMapper.insert(photo);
            return loadDetail(id, userId);
        } catch (RuntimeException exception) {
            photoStorage.delete(storedName);
            throw exception;
        }
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public void delete(Long id) {
        requireAdmin();
        Activity activity = requireActivity(id);
        activityMapper.deleteById(activity.getId());
    }

    @Override
    public List<ActivityNoticeResponse> notices() {
        requireAdmin();
        List<ActivityNotice> notices = noticeMapper.selectList(Wrappers.<ActivityNotice>lambdaQuery()
                .orderByDesc(ActivityNotice::getId)
                .last("LIMIT 100"));
        List<ActivityNoticeResponse> responses = new ArrayList<>();
        for (ActivityNotice notice : notices) {
            ActivityNoticeResponse response = new ActivityNoticeResponse();
            response.setId(notice.getId());
            response.setType(notice.getType());
            response.setActivityId(notice.getActivityId());
            response.setMessage(notice.getMessage());
            response.setCreatedAt(notice.getCreateTime());
            response.setRead(YesNo.YES.getValue().equals(notice.getReadFlag()));
            responses.add(response);
        }
        return responses;
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public void readNotice(Long id) {
        requireAdmin();
        int changed = noticeMapper.update(null, Wrappers.<ActivityNotice>lambdaUpdate()
                .eq(ActivityNotice::getId, id)
                .set(ActivityNotice::getReadFlag, YesNo.YES.getValue()));
        if (changed == 0) {
            throw new BusinessException("通知不存在");
        }
    }

    private void insertWithShareCode(Activity activity) {
        for (int attempt = 0; attempt < 3; attempt++) {
            activity.setShareCode(nextShareCode());
            try {
                activityMapper.insert(activity);
                return;
            } catch (DuplicateKeyException exception) {
                activity.setId(null);
            }
        }
        throw new BusinessException("分享码生成失败，请重试");
    }

    private String nextShareCode() {
        StringBuilder builder = new StringBuilder(SHARE_CODE_LENGTH);
        for (int index = 0; index < SHARE_CODE_LENGTH; index++) {
            builder.append(SHARE_ALPHABET.charAt(random.nextInt(SHARE_ALPHABET.length())));
        }
        return builder.toString();
    }

    private void saveItems(Long activityId, Long userId, List<ActivityItemRequest> requests) {
        assertNoDuplicateDishes(activityId, requests);
        List<DraftItem> drafts = buildDrafts(activityId, userId, requests);
        itemService.saveBatch(drafts.stream().map(DraftItem::item).toList());
        List<ActivityItemOption> options = new ArrayList<>();
        for (DraftItem draft : drafts) {
            if (draft.item().getId() == null) {
                throw new BusinessException("保存菜品失败");
            }
            for (ActivityItemOption option : draft.options()) {
                option.setItemId(draft.item().getId());
                options.add(option);
            }
        }
        if (!options.isEmpty()) {
            optionService.saveBatch(options);
        }
    }

    private void assertNoDuplicateDishes(Long activityId, List<ActivityItemRequest> requests) {
        List<Long> dishIds = requests.stream().map(ActivityItemRequest::getDishId).distinct().toList();
        Map<Long, Dish> dishMap = dishIds.isEmpty()
                ? Map.of()
                : dishMapper.selectList(Wrappers.<Dish>lambdaQuery().in(Dish::getId, dishIds))
                .stream()
                .collect(Collectors.toMap(Dish::getId, Function.identity()));
        Set<Long> uniqueIds = new HashSet<>();
        for (ActivityItemRequest request : requests) {
            Dish dish = dishMap.get(request.getDishId());
            if (dish != null && YesNo.YES.getValue().equals(dish.getAllowRepeat())) {
                continue;
            }
            if (!uniqueIds.add(request.getDishId())) {
                throw new BusinessException("同一道菜不能重复添加");
            }
        }
        if (uniqueIds.isEmpty()) {
            return;
        }
        List<ActivityItem> existing = itemService.list(Wrappers.<ActivityItem>lambdaQuery()
                .eq(ActivityItem::getActivityId, activityId)
                .in(ActivityItem::getDishId, uniqueIds));
        if (!existing.isEmpty()) {
            throw new BusinessException("这道菜已经加过了");
        }
    }

    private List<DraftItem> buildDrafts(Long activityId, Long userId, List<ActivityItemRequest> requests) {
        List<Long> dishIds = requests.stream().map(ActivityItemRequest::getDishId).distinct().toList();
        List<Dish> dishes = dishMapper.selectList(Wrappers.<Dish>lambdaQuery().in(Dish::getId, dishIds));
        Map<Long, Dish> dishMap = dishes.stream().collect(Collectors.toMap(Dish::getId, Function.identity()));
        List<DishOptionGroup> groups = dishOptionGroupMapper.selectList(Wrappers.<DishOptionGroup>lambdaQuery()
                .in(DishOptionGroup::getDishId, dishIds));
        Map<Long, DishOptionGroup> groupMap = groups.stream().collect(Collectors.toMap(DishOptionGroup::getId, Function.identity()));
        List<Long> groupIds = groups.stream().map(DishOptionGroup::getId).toList();
        Map<Long, DishOptionValue> valueMap = groupIds.isEmpty()
                ? Map.of()
                : dishOptionValueMapper.selectList(Wrappers.<DishOptionValue>lambdaQuery().in(DishOptionValue::getGroupId, groupIds))
                .stream()
                .collect(Collectors.toMap(DishOptionValue::getId, Function.identity()));
        List<DraftItem> drafts = new ArrayList<>();
        for (ActivityItemRequest request : requests) {
            Dish dish = dishMap.get(request.getDishId());
            if (dish == null || !YesNo.YES.getValue().equals(dish.getIsActive())) {
                throw new BusinessException("有菜品已下架或不存在");
            }
            ActivityItem item = new ActivityItem();
            item.setActivityId(activityId);
            item.setDishId(dish.getId());
            item.setDishName(dish.getName());
            item.setNote(blankToNull(request.getNote()));
            item.setAddedByUserId(userId);
            drafts.add(new DraftItem(item, snapshotOptions(dish, request.getOptions(), groupMap, valueMap)));
        }
        return drafts;
    }

    private List<ActivityItemOption> snapshotOptions(Dish dish,
                                                     List<ActivityOptionRequest> requests,
                                                     Map<Long, DishOptionGroup> groupMap,
                                                     Map<Long, DishOptionValue> valueMap) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }
        List<ActivityItemOption> options = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        for (ActivityOptionRequest request : requests) {
            if (!seen.add(request.getValueId())) {
                continue;
            }
            DishOptionGroup group = groupMap.get(request.getGroupId());
            DishOptionValue value = valueMap.get(request.getValueId());
            if (group == null || value == null || !dish.getId().equals(group.getDishId()) || !group.getId().equals(value.getGroupId())) {
                throw new BusinessException("菜品特殊项不正确");
            }
            ActivityItemOption option = new ActivityItemOption();
            option.setGroupName(group.getName());
            option.setOptionLabel(value.getLabel());
            options.add(option);
        }
        return options;
    }

    private PageResult<ActivityResponse> toPage(Page<Activity> raw, long userId) {
        Page<ActivityResponse> mapped = new Page<>(raw.getCurrent(), raw.getSize(), raw.getTotal());
        mapped.setRecords(assemble(raw.getRecords(), userId));
        return PageUtil.toResult(mapped);
    }

    private ActivityResponse loadDetail(Long id, long userId) {
        Activity activity = requireActivity(id);
        List<ActivityResponse> responses = assemble(List.of(activity), userId);
        return responses.get(0);
    }

    private List<ActivityResponse> assemble(List<Activity> activities, long userId) {
        if (activities.isEmpty()) {
            return List.of();
        }
        List<Long> activityIds = activities.stream().map(Activity::getId).toList();
        Map<Long, List<ActivityParticipant>> participantMap = participantMapper.selectList(Wrappers.<ActivityParticipant>lambdaQuery()
                        .in(ActivityParticipant::getActivityId, activityIds))
                .stream()
                .collect(Collectors.groupingBy(ActivityParticipant::getActivityId));
        List<ActivityItem> items = itemService.list(Wrappers.<ActivityItem>lambdaQuery()
                .in(ActivityItem::getActivityId, activityIds)
                .orderByAsc(ActivityItem::getId));
        Map<Long, List<ActivityItem>> itemMap = items.stream().collect(Collectors.groupingBy(ActivityItem::getActivityId));
        List<Long> itemIds = items.stream().map(ActivityItem::getId).toList();
        Map<Long, List<ActivityItemOption>> optionMap = itemIds.isEmpty()
                ? Map.of()
                : optionMapper.selectList(Wrappers.<ActivityItemOption>lambdaQuery().in(ActivityItemOption::getItemId, itemIds))
                .stream()
                .collect(Collectors.groupingBy(ActivityItemOption::getItemId));
        Map<Long, List<ActivityPhoto>> photoMap = photoMapper.selectList(Wrappers.<ActivityPhoto>lambdaQuery()
                        .in(ActivityPhoto::getActivityId, activityIds)
                        .orderByDesc(ActivityPhoto::getId))
                .stream()
                .collect(Collectors.groupingBy(ActivityPhoto::getActivityId));
        Set<Long> userIds = new HashSet<>();
        for (Activity activity : activities) {
            userIds.add(activity.getUserId());
        }
        participantMap.values().forEach(list -> list.forEach(item -> userIds.add(item.getUserId())));
        items.forEach(item -> userIds.add(item.getAddedByUserId()));
        photoMap.values().forEach(list -> list.forEach(item -> userIds.add(item.getUserId())));
        Map<Long, User> users = userMapper.selectList(Wrappers.<User>lambdaQuery().in(User::getId, userIds))
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        List<ActivityResponse> responses = new ArrayList<>();
        for (Activity activity : activities) {
            responses.add(toResponse(activity, userId, users,
                    participantMap.getOrDefault(activity.getId(), List.of()),
                    itemMap.getOrDefault(activity.getId(), List.of()),
                    optionMap,
                    photoMap.getOrDefault(activity.getId(), List.of())));
        }
        return responses;
    }

    private ActivityResponse toResponse(Activity activity,
                                        long userId,
                                        Map<Long, User> users,
                                        List<ActivityParticipant> participants,
                                        List<ActivityItem> items,
                                        Map<Long, List<ActivityItemOption>> optionMap,
                                        List<ActivityPhoto> photos) {
        boolean owner = activity.getUserId().equals(userId);
        boolean member = owner || participants.stream().anyMatch(item -> item.getUserId().equals(userId));
        boolean open = ActivityStatus.OPEN.getValue().equals(activity.getStatus());
        boolean replied = ActivityStatus.REPLIED.getValue().equals(activity.getStatus());
        boolean completed = ActivityStatus.COMPLETED.getValue().equals(activity.getStatus());
        ActivityResponse response = new ActivityResponse();
        response.setId(activity.getId());
        response.setName(activity.getName());
        response.setShareCode(activity.getShareCode());
        response.setUserId(activity.getUserId());
        response.setUserName(displayName(users.get(activity.getUserId())));
        response.setScheduledAt(activity.getScheduledAt());
        response.setLocation(activity.getLocation());
        response.setPeopleCount(peopleCount(activity.getPeopleCount()));
        response.setTotalPeople(totalPeople(activity, participants));
        response.setStatus(activity.getStatus());
        response.setCreatedAt(activity.getCreateTime());
        response.setRepliedAt(activity.getRepliedAt());
        response.setReplyNote(activity.getReplyNote());
        response.setWithdrawnAt(activity.getWithdrawnAt());
        response.setCompletedAt(activity.getCompletedAt());
        response.setParticipantIds(participants.stream().map(ActivityParticipant::getUserId).toList());
        response.setParticipants(toParticipants(activity, users, participants));
        response.setItems(toItems(items, optionMap, users));
        response.setPhotos(toPhotos(photos, users));
        response.setOwner(owner);
        response.setCanAdd(member && (open || replied));
        response.setCanEdit(owner && open);
        response.setCanWithdraw(owner && (open || replied));
        response.setCanComplete(owner && (open || replied));
        response.setCanUpload(member && completed);
        return response;
    }

    private List<ActivityParticipantResponse> toParticipants(Activity activity,
                                                             Map<Long, User> users,
                                                             List<ActivityParticipant> participants) {
        List<ActivityParticipantResponse> people = new ArrayList<>();
        people.add(toPerson(activity.getUserId(), users, peopleCount(activity.getPeopleCount()), true));
        participants.stream()
                .sorted(Comparator.comparing(ActivityParticipant::getId))
                .filter(item -> !activity.getUserId().equals(item.getUserId()))
                .forEach(item -> people.add(toPerson(item.getUserId(), users, peopleCount(item.getPeopleCount()), false)));
        return people;
    }

    private ActivityParticipantResponse toPerson(Long userId, Map<Long, User> users, int count, boolean owner) {
        User user = users.get(userId);
        ActivityParticipantResponse person = new ActivityParticipantResponse();
        person.setId(userId);
        person.setName(displayName(user));
        person.setAvatar(user == null ? null : avatarStorage.url(user.getAvatar()));
        person.setOwner(owner);
        person.setPeopleCount(count);
        return person;
    }

    private int totalPeople(Activity activity, List<ActivityParticipant> participants) {
        int total = peopleCount(activity.getPeopleCount());
        for (ActivityParticipant participant : participants) {
            if (!activity.getUserId().equals(participant.getUserId())) {
                total += peopleCount(participant.getPeopleCount());
            }
        }
        return total;
    }

    private int normalizePeopleCount(Integer count) {
        if (count == null) {
            return 1;
        }
        return peopleCount(count);
    }

    private int peopleCount(Integer count) {
        if (count == null || count < 1) {
            return 1;
        }
        return Math.min(count, 20);
    }

    private List<ActivityItemResponse> toItems(List<ActivityItem> items,
                                               Map<Long, List<ActivityItemOption>> optionMap,
                                               Map<Long, User> users) {
        Map<Long, Dish> dishMap = new HashMap<>();
        List<Long> dishIds = items.stream()
                .map(ActivityItem::getDishId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (!dishIds.isEmpty()) {
            for (Dish dish : dishMapper.selectBatchIds(dishIds)) {
                dishMap.put(dish.getId(), dish);
            }
        }
        List<ActivityItemResponse> responses = new ArrayList<>();
        for (ActivityItem item : items) {
            ActivityItemResponse response = new ActivityItemResponse();
            response.setId(item.getId());
            response.setDishId(item.getDishId());
            response.setDishName(item.getDishName());
            Dish dish = item.getDishId() == null ? null : dishMap.get(item.getDishId());
            response.setAllowRepeat(dish != null && YesNo.YES.getValue().equals(dish.getAllowRepeat()));
            response.setDishImageUrl(dish == null ? null : dishImageStorage.url(dish.getImageName()));
            response.setNote(item.getNote());
            response.setAddedByUserId(item.getAddedByUserId());
            User addedBy = users.get(item.getAddedByUserId());
            response.setAddedByUserName(displayName(addedBy));
            response.setAddedByUserAvatar(addedBy == null ? null : avatarStorage.url(addedBy.getAvatar()));
            List<ActivityOptionResponse> options = new ArrayList<>();
            for (ActivityItemOption option : optionMap.getOrDefault(item.getId(), List.of())) {
                ActivityOptionResponse optionResponse = new ActivityOptionResponse();
                optionResponse.setId(option.getId());
                optionResponse.setGroupName(option.getGroupName());
                optionResponse.setOptionLabel(option.getOptionLabel());
                options.add(optionResponse);
            }
            response.setOptions(options);
            responses.add(response);
        }
        return responses;
    }

    private List<ActivityPhotoResponse> toPhotos(List<ActivityPhoto> photos, Map<Long, User> users) {
        List<ActivityPhotoResponse> responses = new ArrayList<>();
        for (ActivityPhoto photo : photos) {
            ActivityPhotoResponse response = new ActivityPhotoResponse();
            response.setId(photo.getId());
            response.setUserId(photo.getUserId());
            response.setUserName(displayName(users.get(photo.getUserId())));
            response.setUrl(photoStorage.url(photo.getFileName()));
            response.setCreatedAt(photo.getCreateTime());
            responses.add(response);
        }
        return responses;
    }

    private Activity requireActivity(Long id) {
        Activity activity = activityMapper.selectById(id);
        if (activity == null) {
            throw new BusinessException("活动不存在");
        }
        return activity;
    }

    private Activity requireByCode(String shareCode) {
        if (shareCode == null || shareCode.isBlank()) {
            throw new BusinessException("请填写分享码");
        }
        String code = shareCode.trim().toUpperCase(Locale.ROOT);
        Activity activity = activityMapper.selectOne(Wrappers.<Activity>lambdaQuery().eq(Activity::getShareCode, code));
        if (activity == null) {
            throw new BusinessException("分享码不存在");
        }
        return activity;
    }

    private boolean isMember(Activity activity, long userId) {
        if (activity.getUserId().equals(userId)) {
            return true;
        }
        Long count = participantMapper.selectCount(Wrappers.<ActivityParticipant>lambdaQuery()
                .eq(ActivityParticipant::getActivityId, activity.getId())
                .eq(ActivityParticipant::getUserId, userId));
        return count != null && count > 0;
    }

    private boolean canAcceptMember(Activity activity) {
        return ActivityStatus.OPEN.getValue().equals(activity.getStatus())
                || ActivityStatus.REPLIED.getValue().equals(activity.getStatus());
    }

    private String closedMessage(Activity activity) {
        if (ActivityStatus.WITHDRAWN.getValue().equals(activity.getStatus())) {
            return "活动已撤回";
        }
        if (ActivityStatus.COMPLETED.getValue().equals(activity.getStatus())) {
            return "活动已完成，不能再加入或加菜";
        }
        return "现在不能再加菜";
    }

    /** 发起人唯一昵称校验，通过后把用户带回，给默认活动名用。 */
    private User requireUniqueName(long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        String nickname = user.getNickname() == null ? "" : user.getNickname().trim();
        if (nickname.isEmpty()) {
            throw new BusinessException("请先在「我的」设置一个唯一昵称");
        }
        Long count = userMapper.selectCount(Wrappers.<User>lambdaQuery().eq(User::getNickname, nickname));
        if (count != null && count > 1) {
            throw new BusinessException("这个昵称已经有人用了，请先改成别人没有的名字");
        }
        return user;
    }

    /** 名称为空时拼默认名：谁发起的几月几号的小聚。 */
    private String resolveName(String raw, User initiator, LocalDateTime scheduledAt) {
        String name = raw == null ? "" : raw.trim();
        if (!name.isEmpty()) {
            return name;
        }
        LocalDateTime time = scheduledAt == null ? LocalDateTime.now() : scheduledAt;
        String nickname = initiator.getNickname() == null ? "" : initiator.getNickname().trim();
        return String.format("%s的%d月%d日小聚", nickname, time.getMonthValue(), time.getDayOfMonth());
    }

    private ActivityPageQuery prepareQuery(ActivityPageQuery query) {
        ActivityPageQuery safe = query == null ? new ActivityPageQuery() : query;
        safe.setStatus(normalizeStatus(safe.getStatus()));
        safe.setUserId(null);
        return safe;
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        String value = status.trim();
        for (ActivityStatus item : ActivityStatus.values()) {
            if (item.getValue().equals(value)) {
                return value;
            }
        }
        throw new BusinessException("状态不正确");
    }

    private void requireAdmin() {
        if (!isAdmin(currentUserId())) {
            throw new BusinessException("需要超级管理员权限");
        }
    }

    private boolean isAdmin(long userId) {
        User user = userMapper.selectById(userId);
        return user != null && YesNo.YES.getValue().equals(user.getSuperAdmin());
    }

    private long currentUserId() {
        return StpUtil.getLoginIdAsLong();
    }

    private String displayName(User user) {
        if (user == null) {
            return "未知用户";
        }
        if (user.getNickname() != null && !user.getNickname().isBlank()) {
            return user.getNickname();
        }
        return user.getUsername();
    }

    private String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private record DraftItem(ActivityItem item, List<ActivityItemOption> options) {
    }
}
