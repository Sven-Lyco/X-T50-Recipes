package de.fuji.xt50recipes.ai;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ImageUtilsTest {

    @Test
    void detectMimeType_jpeg() {
        byte[] jpeg = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};
        assertThat(ImageUtils.detectMimeType(jpeg, "unknown")).isEqualTo("image/jpeg");
    }

    @Test
    void detectMimeType_png() {
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', (byte) 0x0D, (byte) 0x0A};
        assertThat(ImageUtils.detectMimeType(png, "unknown")).isEqualTo("image/png");
    }

    @Test
    void detectMimeType_gif() {
        byte[] gif = {'G', 'I', 'F', '8', '9', 'a'};
        assertThat(ImageUtils.detectMimeType(gif, "unknown")).isEqualTo("image/gif");
    }

    @Test
    void detectMimeType_webp() {
        byte[] webp = new byte[12];
        webp[0] = 'R'; webp[1] = 'I'; webp[2] = 'F'; webp[3] = 'F';
        webp[8] = 'W'; webp[9] = 'E'; webp[10] = 'B'; webp[11] = 'P';
        assertThat(ImageUtils.detectMimeType(webp, "unknown")).isEqualTo("image/webp");
    }

    @Test
    void detectMimeType_unknown_returnsFallback() {
        byte[] unknown = {0x00, 0x01, 0x02, 0x03};
        assertThat(ImageUtils.detectMimeType(unknown, "image/octet-stream")).isEqualTo("image/octet-stream");
    }

    @Test
    void detectMimeType_tooShort_returnsFallback() {
        byte[] tooShort = {(byte) 0xFF, (byte) 0xD8};
        assertThat(ImageUtils.detectMimeType(tooShort, "fallback")).isEqualTo("fallback");
    }

    @Test
    void extractExifContext_invalidBytes_returnsNull() {
        assertThat(ImageUtils.extractExifContext("not an image".getBytes())).isNull();
    }

    @Test
    void extractExifContext_emptyList_returnsNull() {
        assertThat(ImageUtils.extractExifContext(java.util.List.of())).isNull();
    }
}
