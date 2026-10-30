package com.kiven.lpp.ourpact.user.service;

import com.kiven.lpp.ourpact.common.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

/**
 * 把头像写到服务器目录。Docker 部署时该目录挂载到宿主机。
 *
 * @author zhangliang
 */
@Slf4j
@Service
public class AvatarStorage {

    private static final int MAX_BYTES = 10 * 1024 * 1024;

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
     * 校验文件头后保存，返回生成的文件名。
     */
    public String save(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("请选择头像");
        }
        byte[] content = readContent(file);
        if (content.length > MAX_BYTES) {
            throw new BusinessException("头像不能超过 10MB");
        }
        String extension = detectExtension(content);
        String storedName = UUID.randomUUID().toString().replace("-", "") + "." + extension;
        Path target = directory.resolve(storedName);
        try {
            Files.write(target, content);
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

    private byte[] readContent(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException exception) {
            throw new BusinessException("头像保存失败");
        }
    }

    private String detectExtension(byte[] content) {
        if (isJpeg(content)) {
            return "jpg";
        }
        if (isPng(content)) {
            return "png";
        }
        if (isGif(content)) {
            return "gif";
        }
        if (isWebp(content)) {
            return "webp";
        }
        throw new BusinessException("头像只支持 jpg、png、gif、webp");
    }

    private boolean isJpeg(byte[] content) {
        return content.length >= 3
                && (content[0] & 0xFF) == 0xFF
                && (content[1] & 0xFF) == 0xD8
                && (content[2] & 0xFF) == 0xFF;
    }

    private boolean isPng(byte[] content) {
        return content.length >= 8
                && (content[0] & 0xFF) == 0x89
                && content[1] == 0x50
                && content[2] == 0x4E
                && content[3] == 0x47
                && content[4] == 0x0D
                && content[5] == 0x0A
                && content[6] == 0x1A
                && content[7] == 0x0A;
    }

    private boolean isGif(byte[] content) {
        return content.length >= 6
                && content[0] == 'G'
                && content[1] == 'I'
                && content[2] == 'F'
                && content[3] == '8'
                && (content[4] == '7' || content[4] == '9')
                && content[5] == 'a';
    }

    private boolean isWebp(byte[] content) {
        return content.length >= 12
                && content[0] == 'R'
                && content[1] == 'I'
                && content[2] == 'F'
                && content[3] == 'F'
                && content[8] == 'W'
                && content[9] == 'E'
                && content[10] == 'B'
                && content[11] == 'P';
    }

    private boolean isStoredName(String storedName) {
        return storedName != null && storedName.matches("[a-zA-Z0-9]+\\.[a-zA-Z0-9]+");
    }
}
