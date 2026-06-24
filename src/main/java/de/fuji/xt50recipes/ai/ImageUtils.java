package de.fuji.xt50recipes.ai;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import lombok.extern.slf4j.Slf4j;

import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.List;

@Slf4j
public final class ImageUtils {

    private ImageUtils() {}

    public static String detectMimeType(byte[] bytes, String fallback) {
        if (bytes.length >= 4) {
            if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF)
                return "image/jpeg";
            if ((bytes[0] & 0xFF) == 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G')
                return "image/png";
            if (bytes[0] == 'G' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == '8')
                return "image/gif";
            if (bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                    && bytes.length >= 12
                    && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P')
                return "image/webp";
        }
        return fallback;
    }

    public static String extractExifContext(byte[] bytes) {
        try {
            Metadata metadata = ImageMetadataReader.readMetadata(new ByteArrayInputStream(bytes));
            List<String> fields = new ArrayList<>();

            ExifSubIFDDirectory sub = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);
            if (sub != null) {
                if (sub.containsTag(ExifSubIFDDirectory.TAG_ISO_EQUIVALENT))
                    fields.add("ISO " + sub.getInt(ExifSubIFDDirectory.TAG_ISO_EQUIVALENT));
                if (sub.containsTag(ExifSubIFDDirectory.TAG_EXPOSURE_TIME))
                    fields.add("Belichtung " + sub.getDescription(ExifSubIFDDirectory.TAG_EXPOSURE_TIME));
                if (sub.containsTag(ExifSubIFDDirectory.TAG_FNUMBER))
                    fields.add("Blende " + sub.getDescription(ExifSubIFDDirectory.TAG_FNUMBER));
                if (sub.containsTag(ExifSubIFDDirectory.TAG_FOCAL_LENGTH))
                    fields.add("Brennweite " + sub.getDescription(ExifSubIFDDirectory.TAG_FOCAL_LENGTH));
                if (sub.containsTag(ExifSubIFDDirectory.TAG_WHITE_BALANCE_MODE))
                    fields.add("WB " + sub.getDescription(ExifSubIFDDirectory.TAG_WHITE_BALANCE_MODE));
                if (sub.containsTag(ExifSubIFDDirectory.TAG_EXPOSURE_BIAS))
                    fields.add("Belichtungskorrektur " + sub.getDescription(ExifSubIFDDirectory.TAG_EXPOSURE_BIAS));
            }

            ExifIFD0Directory ifd0 = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
            if (ifd0 != null && ifd0.containsTag(ExifIFD0Directory.TAG_MODEL))
                fields.add(0, "Kamera: " + ifd0.getString(ExifIFD0Directory.TAG_MODEL));

            return fields.isEmpty() ? null : String.join(", ", fields);
        } catch (Exception e) {
            log.debug("EXIF extraction failed: {}", e.getMessage());
            return null;
        }
    }

    public static String extractExifContext(List<byte[]> images) {
        List<String> parts = new ArrayList<>();
        for (byte[] bytes : images) {
            String ctx = extractExifContext(bytes);
            if (ctx != null) parts.add(ctx);
        }
        return parts.isEmpty() ? null : String.join(" | ", parts);
    }
}
