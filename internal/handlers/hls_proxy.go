package handlers

import (
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
)

func ProxyHLS(c *gin.Context) {
	rawURL := c.Query("url")
	if rawURL == "" {
		c.Status(http.StatusBadRequest)
		return
	}

	resp, err := http.Get(rawURL)
	if err != nil {
		c.Status(http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	ct := resp.Header.Get("Content-Type")
	proxyURL := "/api/hls/proxy?url="

	if strings.Contains(ct, "mpegurl") || strings.Contains(ct, "m3u8") ||
		strings.HasSuffix(rawURL, ".m3u8") || strings.HasSuffix(rawURL, ".m3u") {

		baseURL := rawURL
		if lastSlash := strings.LastIndex(baseURL, "/"); lastSlash >= 0 {
			baseURL = baseURL[:lastSlash+1]
		}

		body, _ := io.ReadAll(resp.Body)
		lines := strings.Split(string(body), "\n")
		result := make([]string, 0, len(lines))

		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, "#") {
				result = append(result, line)
				continue
			}
			segURL := line
			if !strings.HasPrefix(segURL, "http://") && !strings.HasPrefix(segURL, "https://") {
				segURL = baseURL + segURL
			}
			result = append(result, proxyURL+url.QueryEscape(segURL))
		}

		c.Data(http.StatusOK, "application/vnd.apple.mpegurl", []byte(strings.Join(result, "\n")))
		return
	}

	io.Copy(c.Writer, resp.Body)
}
