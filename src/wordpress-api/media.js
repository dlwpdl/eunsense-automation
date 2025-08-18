/**
 * WordPress 미디어 관리 API
 */

/**
 * 미디어 관리 클래스
 */
class MediaManager {
  constructor(client) {
    this.client = client;
  }

  /**
   * 모든 미디어 조회
   */
  async getAllMedia(params = {}) {
    const defaultParams = {
      per_page: 10,
      page: 1,
      order: 'desc',
      orderby: 'date'
    };
    
    const queryParams = { ...defaultParams, ...params };
    const queryString = Object.keys(queryParams)
      .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
      .join('&');
      
    return await this.client.request(`/media?${queryString}`);
  }

  /**
   * 특정 미디어 조회
   */
  async getMedia(mediaId) {
    return await this.client.request(`/media/${mediaId}`);
  }

  /**
   * 미디어 업로드
   */
  async uploadMedia(fileBlob, filename, mimeType, metadata = {}) {
    // Google Apps Script 환경에서 파일 업로드
    const boundary = '----WebKitFormBoundary' + Utilities.getUuid();
    
    let body = `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
    body += `Content-Type: ${mimeType}\r\n\r\n`;
    
    // 파일 데이터 추가
    const fileData = typeof fileBlob === 'string' ? 
      Utilities.newBlob(fileBlob).getBytes() : 
      fileBlob.getBytes();
    
    body += String.fromCharCode.apply(null, fileData);
    body += `\r\n--${boundary}--\r\n`;

    const options = {
      method: 'POST',
      headers: {
        'Authorization': this.client.headers.Authorization,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      payload: Utilities.newBlob(body).getBytes(),
      muteHttpExceptions: true
    };

    const url = `${this.client.baseUrl}/wp-json/wp/v2/media`;
    const response = UrlFetchApp.fetch(url, options);
    
    if (response.getResponseCode() !== 201) {
      throw new Error(`미디어 업로드 실패: ${response.getResponseCode()} - ${response.getContentText()}`);
    }
    
    const result = JSON.parse(response.getContentText());
    
    // 메타데이터 업데이트
    if (Object.keys(metadata).length > 0) {
      await this.updateMedia(result.id, metadata);
    }
    
    return result;
  }

  /**
   * URL에서 미디어 업로드
   */
  async uploadFromUrl(imageUrl, filename = null, metadata = {}) {
    try {
      const response = UrlFetchApp.fetch(imageUrl);
      const blob = response.getBlob();
      
      const actualFilename = filename || imageUrl.split('/').pop().split('?')[0];
      const mimeType = blob.getContentType();
      
      return await this.uploadMedia(blob, actualFilename, mimeType, metadata);
    } catch (error) {
      throw new Error(`URL에서 미디어 업로드 실패: ${error.message}`);
    }
  }

  /**
   * 미디어 정보 업데이트
   */
  async updateMedia(mediaId, updateData) {
    return await this.client.request(`/media/${mediaId}`, 'PUT', updateData);
  }

  /**
   * 미디어 삭제
   */
  async deleteMedia(mediaId, force = false) {
    const params = force ? '?force=true' : '';
    return await this.client.request(`/media/${mediaId}${params}`, 'DELETE');
  }

  /**
   * 미디어 검색
   */
  async searchMedia(query, params = {}) {
    const searchParams = {
      search: query,
      per_page: 10,
      ...params
    };
    
    return await this.getAllMedia(searchParams);
  }

  /**
   * 미디어 타입별 조회
   */
  async getMediaByType(mediaType, params = {}) {
    const typeParams = {
      media_type: mediaType, // image, video, audio, application
      ...params
    };
    
    return await this.getAllMedia(typeParams);
  }

  /**
   * 이미지만 조회
   */
  async getImages(params = {}) {
    return await this.getMediaByType('image', params);
  }

  /**
   * 사용되지 않는 미디어 조회
   */
  async getUnusedMedia() {
    const allMedia = await this.getAllMedia({ per_page: 100 });
    const unusedMedia = [];
    
    for (const media of allMedia) {
      // 포스트에서 사용 여부 확인
      const posts = await this.client.request(`/posts?search=${media.source_url}`);
      if (posts.length === 0) {
        unusedMedia.push(media);
      }
    }
    
    return unusedMedia;
  }

  /**
   * 미디어 대량 삭제
   */
  async bulkDeleteMedia(mediaIds, force = false) {
    const results = [];
    
    for (const mediaId of mediaIds) {
      try {
        const result = await this.deleteMedia(mediaId, force);
        results.push({ mediaId, success: true, result });
      } catch (error) {
        results.push({ mediaId, success: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * 미디어 최적화 정보
   */
  async getMediaStats() {
    const allMedia = await this.getAllMedia({ per_page: 100 });
    
    const stats = {
      total: allMedia.length,
      byType: {},
      totalSize: 0,
      averageSize: 0
    };
    
    allMedia.forEach(media => {
      const type = media.mime_type.split('/')[0];
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      
      if (media.media_details && media.media_details.filesize) {
        stats.totalSize += media.media_details.filesize;
      }
    });
    
    stats.averageSize = stats.total > 0 ? stats.totalSize / stats.total : 0;
    
    return stats;
  }
}

/**
 * 미디어 관리자 인스턴스 생성
 */
function createMediaManager(baseUrl, username, appPassword) {
  const client = new WordPressClient(baseUrl, username, appPassword);
  return new MediaManager(client);
}

/**
 * 편의 함수들
 */
function getAllMedia(baseUrl, username, appPassword, params = {}) {
  const manager = createMediaManager(baseUrl, username, appPassword);
  return manager.getAllMedia(params);
}

function uploadMedia(baseUrl, username, appPassword, fileBlob, filename, mimeType, metadata = {}) {
  const manager = createMediaManager(baseUrl, username, appPassword);
  return manager.uploadMedia(fileBlob, filename, mimeType, metadata);
}

function uploadFromUrl(baseUrl, username, appPassword, imageUrl, filename = null, metadata = {}) {
  const manager = createMediaManager(baseUrl, username, appPassword);
  return manager.uploadFromUrl(imageUrl, filename, metadata);
}

function deleteMedia(baseUrl, username, appPassword, mediaId, force = false) {
  const manager = createMediaManager(baseUrl, username, appPassword);
  return manager.deleteMedia(mediaId, force);
}