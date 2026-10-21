package com.kiven.lpp.ourpact.service;

import com.kiven.lpp.ourpact.common.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * 把头像写到服务器目录。Docker 部署时该目录挂载到宿主机。
 *
 * @author zhangliang
 */
@Slf4j
@Service
public class AvatarStorage {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");

    private static final String URL_PREFIX = "/api/files/avatars/";

    private final Path directory;

    public AvatarStorage(@Value("${app.avatar.dir}") String dir) throws IOException {
        this.directory = Path.of(dir).toAbsolutePath().normalize();
        Files.createDirectories(this.directory);
    }

    /**
     * 资源映射使用的目录，末尾带分隔符。
     */
    public String resourceLocation() {
        String location = directory.toUri().toString();
        if (!location.endsWith("/")) {
            return location + "/";
        }
        return location;
    }

    /**
     * 保存上传文件，返回生成的文件名。
     */
    public String save(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("请选择头像");
        }
        String extension = extensionOf(file.getOriginalFilename());
        String storedName = UUID.randomUUID().toString().replace("-", "") + "." + extension;
        Path target = directory.resolve(storedName);
        try (InputStream input = file.getInputStream()) {
            Files.copy(input, target);
        } catch (IOException exception) {
            throw new BusinessException("头像保存失败");
        }
        return storedName;
    }

    /**
     * 删除旧头像。文件名不合法或文件已不存在时忽略。
     */
    public void delete(String storedName) {
        if (!isStoredName(storedName)) {
            return;
        }
        try {
            Files.deleteIfExists(directory.resolve(storedName));
        } catch (IOException exception) {
            log.warn("旧头像删除失败: {}", storedName);
        }
    }

    /**
     * 给前端用的访问路径。没有头像时返回 null。
     */
    public String url(String storedName) {
        if (!isStoredName(storedName)) {
            return null;
        }
        return URL_PREFIX + storedName;
    }

    private String extensionOf(String originalName) {
        if (originalName == null) {
            throw new BusinessException("头像只支持 jpg、png、gif、webp");
        }
        int dot = originalName.lastIndexOf('.');
        if (dot < 0 || dot == originalName.length() - 1) {
            throw new BusinessException("头像只支持 jpg、png、gif、webp");
        }
        String extension = originalName.substring(dot + 1).toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BusinessException("头像只支持 jpg、png、gif、webp");
        }
        return extension;
    }

    private boolean isStoredName(String storedName) {
        return storedName != null && storedName.matches("[a-zA-Z0-9]+\\.[a-zA-Z0-9]+");
    }
}
