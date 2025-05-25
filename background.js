// Background script for ByteDance Watermark Remover (Manifest V3)

// 更新注入按钮脚本，使用下载功能
const INJECT_BUTTON_SCRIPT = `
  // 跟踪当前选中的图片
  let selectedImage = null;

  // 从URL中提取文件名
  function getFilenameFromUrl(url) {
    try {
      const urlObj = new URL(url);
      let pathname = urlObj.pathname;
      let filename = pathname.split('/').pop() || 'image.jpg';
      filename = filename.split('?')[0];
      if (!filename.includes('.')) {
        filename += '.jpg';
      }
      return filename;
    } catch (e) {
      return 'image.jpg';
    }
  }

  // 下载图片函数 - 多种尝试方法
  function downloadImage(imgSrc, filename) {
    console.log("开始下载图片:", imgSrc);
    
    // 处理URL，尝试去除水印参数 - 只对下载操作执行
    let cleanSrc = imgSrc;
    
    // 创建一个临时的Image来加载图片进行下载，不影响页面显示
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
      // 创建canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 绘制到canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // 导出为数据URL
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        
        // 创建a标签下载
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename || 'image_nowatermark.jpg';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // 清理
        setTimeout(() => {
          document.body.removeChild(a);
        }, 100);
        
        showDownloadStatus('图片下载成功');
      } catch (error) {
        console.error('Canvas导出失败:', error);
        directDownload();
      }
    };
    
    img.onerror = function() {
      console.error('图片加载失败，尝试直接下载');
      directDownload();
    };
    
    // 直接下载的备用方法
    function directDownload() {
      const a = document.createElement('a');
      a.href = imgSrc;
      a.download = filename || 'image.jpg';
      a.target = '_blank';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);
      
      showDownloadStatus('尝试直接下载图片');
    }
    
    // 设置src开始加载
    img.src = cleanSrc;
  }
  
  // 显示下载状态
  function showDownloadStatus(message) {
    const statusElement = document.createElement('div');
    statusElement.textContent = message;
    statusElement.style.position = 'fixed';
    statusElement.style.top = '70px';
    statusElement.style.right = '20px';
    statusElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    statusElement.style.color = 'white';
    statusElement.style.padding = '8px 12px';
    statusElement.style.borderRadius = '4px';
    statusElement.style.zIndex = '2147483647';
    statusElement.style.transition = 'opacity 0.3s';
    statusElement.style.opacity = '1';
    document.body.appendChild(statusElement);
    
    setTimeout(() => {
      statusElement.style.opacity = '0';
      setTimeout(() => statusElement.remove(), 300);
    }, 3000);
  }

  // 设置图片选择功能
  function setupImageSelection() {
    // 添加CSS样式
    const style = document.createElement('style');
    style.textContent = \`
      .selectable-image {
        transition: outline 0.2s ease;
      }
      
      .selectable-image:hover {
        cursor: pointer !important;
      }
      
      #image-selection-hint {
        transition: opacity 0.3s;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
      }
    \`;
    document.head.appendChild(style);
    
    // 获取页面上所有符合条件的图片
    const allImages = document.querySelectorAll('img');
    
    // 为每个图片添加点击事件
    allImages.forEach(img => {
      // 跳过太小的图片
      if (!img.src || 
          img.style.display === 'none' || 
          img.style.visibility === 'hidden' ||
          (img.naturalWidth > 0 && img.naturalWidth < 100) || 
          (img.naturalHeight > 0 && img.naturalHeight < 100)) {
        return;
      }
      
      // 只处理特定域名的图片
      if (img.src.includes('doubao.com') || 
          img.src.includes('jimeng.ai') ||
          img.src.includes('byteimg.com') ||
          img.src.includes('jianying.com')) {
        
        // 避免重复添加事件
        if (!img.classList.contains('selectable-image')) {
          // 添加样式类使图片可点击
          img.classList.add('selectable-image');
          
          // 添加鼠标悬停效果
          img.addEventListener('mouseenter', function() {
            this.style.outline = '3px solid #4285f4';
            this.style.cursor = 'pointer';
            
            // 创建或更新提示元素
            let hint = document.getElementById('image-selection-hint');
            if (!hint) {
              hint = document.createElement('div');
              hint.id = 'image-selection-hint';
              hint.style.position = 'fixed';
              hint.style.top = '120px';
              hint.style.right = '20px';
              hint.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
              hint.style.color = 'white';
              hint.style.padding = '8px 12px';
              hint.style.borderRadius = '4px';
              hint.style.zIndex = '2147483646';
              hint.style.pointerEvents = 'none';
              document.body.appendChild(hint);
            }
            
            hint.textContent = '点击选择此图片';
            hint.style.opacity = '1';
          });
          
          // 移除鼠标悬停效果
          img.addEventListener('mouseleave', function() {
            // 如果不是选中的图片，移除高亮
            if (this !== selectedImage) {
              this.style.outline = 'none';
            }
            this.style.cursor = 'default';
            
            // 隐藏提示
            const hint = document.getElementById('image-selection-hint');
            if (hint) {
              hint.style.opacity = '0';
            }
          });
          
          // 点击选择图片
          img.addEventListener('click', function(e) {
            // 阻止链接跳转等默认行为
            e.preventDefault();
            e.stopPropagation();
            
            // 移除之前选中图片的高亮
            if (selectedImage) {
              selectedImage.style.outline = 'none';
            }
            
            // 设置当前图片为选中
            selectedImage = this;
            this.style.outline = '3px solid #4285f4';
            
            showDownloadStatus('已选择图片，点击右上角按钮下载');
            
            // 更新按钮文本
            const button = document.getElementById('watermark-remover-button');
            if (button) {
              const textSpan = button.querySelector('.text');
              if (textSpan) {
                textSpan.textContent = '下载选中图片';
              }
              button.title = '下载选中图片';
            }
            
            return false;
          });
        }
      }
    });
  }

  // 下载选中图片
  function downloadSelectedImage() {
    console.log('尝试下载选中图片...');
    
    // 如果没有选中图片，提示用户选择
    if (!selectedImage) {
      // 尝试找到页面上最显著的图片作为默认选择
      const visibleImages = Array.from(document.querySelectorAll('img')).filter(img => {
        // 只考虑可见、较大的图片
        if (!img.src || 
            img.style.display === 'none' || 
            img.style.visibility === 'hidden' ||
            (img.naturalWidth > 0 && img.naturalWidth < 100) || 
            (img.naturalHeight > 0 && img.naturalHeight < 100)) {
          return false;
        }
        
        // 检查域名
        return (img.src.includes('doubao.com') || 
                img.src.includes('jimeng.ai') ||
                img.src.includes('byteimg.com') ||
                img.src.includes('jianying.com'));
      });
      
      // 按尺寸排序，选择最大的图片
      if (visibleImages.length > 0) {
        const mainImage = visibleImages.sort((a, b) => {
          return (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight);
        })[0];
        
        selectedImage = mainImage;
        showDownloadStatus('已自动选择最大图片');
      } else {
        showDownloadStatus('请先点击选择要下载的图片');
        return;
      }
    }
    
    // 下载选中的图片，不修改原图
    const filename = 'image_nowatermark_' + new Date().getTime() + '.jpg';
    downloadImage(selectedImage.src, filename);
    showDownloadStatus('正在下载选中的图片...');
  }

  // 检查按钮是否存在，如果不存在则添加
  function injectButton() {
    if (document.getElementById('watermark-remover-button')) {
      console.log("Button already exists (from injected script)");
      return;
    }
    
    try {
      // 创建按钮
      const button = document.createElement('button');
      button.id = 'watermark-remover-button';
      button.className = 'watermark-remover-button';
      
      // 添加图标
      const icon = document.createElement('span');
      icon.className = 'icon';
      button.appendChild(icon);
      
      // 添加文本（放入span以便控制显示）
      const text = document.createElement('span');
      text.className = 'text';
      text.textContent = '选择并下载图片';
      button.appendChild(text);
      
      // 添加title属性作为工具提示
      button.title = '选择并下载图片';
      
      // 变量用于跟踪位置
      let buttonPosition = { y: 20 };
      
      // 全局拖动状态标志
      let globalIsDragging = false;
      let isDownloading = false;
      
      // 强制更新按钮位置 - 不依赖CSS
      function updateButtonPositionForce() {
        // 设置右侧边缘固定位置
        const rightPosition = 20; // 固定在屏幕右侧边缘20px处
        
        // 直接设置样式 - 使用!important以覆盖可能的CSS规则
        button.style.setProperty('top', buttonPosition.y + 'px', 'important');
        button.style.setProperty('left', 'auto', 'important');
        button.style.setProperty('right', rightPosition + 'px', 'important');
      }
      
      // 使用直接的拖动处理
      let isDragging = false;
      let dragStartTime = 0;
      
      // 重新添加鼠标按下事件
      button.onmousedown = function(e) {
        // 只允许左键拖动
        if (e.button !== 0) return;
        
        // 防止拖动时触发点击事件
        const now = new Date().getTime();
        button._mouseDownTime = now;
        
        isDragging = true;
        globalIsDragging = true; // 设置全局拖动状态
        dragStartTime = now;
        
        // 阻止默认事件和冒泡
        e.preventDefault();
        e.stopPropagation();
        
        // 添加文档级别的移动和释放事件
        document.onmousemove = function(moveEvent) {
          if (!isDragging) return;
          
          // 确保全局拖动标志保持激活
          globalIsDragging = true;
          
          // 直接使用鼠标的Y坐标，让按钮中心与鼠标对齐
          const newTop = Math.max(0, Math.min(window.innerHeight - button.offsetHeight, 
                               moveEvent.clientY - (button.offsetHeight / 2)));
          
          // 直接设置位置 - 使用setProperty强制设置
          button.style.setProperty('top', newTop + 'px', 'important');
          buttonPosition.y = newTop;
          
          // 阻止事件
          moveEvent.preventDefault();
          moveEvent.stopPropagation();
        };
        
        document.onmouseup = function(upEvent) {
          if (!isDragging) return;
          
          isDragging = false;
          
          // 延迟重置拖动状态，防止误触发点击事件
          setTimeout(function() {
            globalIsDragging = false;
          }, 300);
          
          // 确保位置被强制应用
          updateButtonPositionForce();
          
          // 尝试保存位置
          try {
            chrome.storage.local.set({
              buttonPositionY: buttonPosition.y
            });
          } catch (err) {
            console.error("保存位置失败:", err.message);
          }
          
          // 移除临时事件
          document.onmousemove = null;
          document.onmouseup = null;
          
          // 阻止事件
          upEvent.preventDefault();
          upEvent.stopPropagation();
        };
      };
      
      // 添加点击事件
      button.onclick = function(e) {
        // 检查如果是拖动状态或拖动结束后不久，不触发下载
        const now = new Date().getTime();
        if (globalIsDragging || isDragging || (now - dragStartTime < 300) || isDownloading) {
          console.log("忽略点击 - 正在拖动或刚结束拖动或正在下载");
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        
        // 设置下载状态
        isDownloading = true;
        
        // 确保使用原始下载函数
        try {
          // 调用下载函数
          downloadSelectedImage();
        } catch (error) {
          console.error("下载出错:", error.message);
        }
        
        // 重置下载状态
        setTimeout(() => {
          isDownloading = false;
        }, 1000);
        
        e.preventDefault();
        e.stopPropagation();
      };
      
      // 设置初始样式 - 固定在右侧位置
      button.style.cursor = 'ns-resize';
      
      // 添加到文档
      document.body.appendChild(button);
      console.log("Button added via injected script");
      
      // 设置图片选择
      setupImageSelection();
      
      // 在页面卸载时清理
      window.addEventListener('beforeunload', function() {
        window.removeEventListener('resize', updateButtonPositionForce);
      });
    } catch (error) {
      console.error("Error injecting button:", error);
    }
  }
  
  // 如果body已存在，立即添加按钮
  if (document.body) {
    injectButton();
  } else {
    // 否则等待DOM加载完成
    document.addEventListener('DOMContentLoaded', injectButton);
  }
  
  // 设置MutationObserver确保按钮始终存在
  const observer = new MutationObserver(function() {
    if (!document.getElementById('watermark-remover-button') && document.body) {
      injectButton();
    }
  });
  
  // 开始观察
  if (document.body) {
    observer.observe(document.body, { childList: true });
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      observer.observe(document.body, { childList: true });
    });
  }
`;

// 更新popup.html的title
chrome.runtime.onInstalled.addListener(() => {
  console.log('Watermark Remover extension installed');
  
  // 移除可能干扰网页正常加载的规则
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1, 2, 3, 4, 5, 6],
    addRules: [
      // 只保留基本的规则，不干扰豆包网站的正常加载
      {
        id: 1,
        priority: 1,
        action: {
          type: 'redirect',
          redirect: {
            regexSubstitution: '\\1\\2'
          }
        },
        condition: {
          regexFilter: '(.*)-(?:dark-watermark|image-dark-watermark|watermark|image-watermark)(.*)',
          resourceTypes: ['image'],
          excludedInitiatorDomains: ['doubao.com', 'jimeng.ai', 'jianying.com', 'byteimg.com']
        }
      }
    ]
  });
});

// 检查URL是否为支持的网站
function isSupportedSite(url) {
  return url.includes('doubao.com') || 
         url.includes('jimeng.ai') || 
         url.includes('jianying.com');
}

// 监听tab更新事件，用于向内容脚本发送消息和注入按钮脚本
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (isSupportedSite(tab.url)) {
      console.log("Supported site detected:", tab.url);
      
      chrome.tabs.sendMessage(tabId, { 
        action: "checkButton",
        url: tab.url
      }).catch(error => {
        console.log("Error sending message to tab, will inject script:", error);
        
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: () => {
            const style = document.createElement('style');
            style.textContent = `
              .watermark-remover-button {
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                background-color: #4285f4 !important;
                color: white !important;
                border: none !important;
                border-radius: 50% !important;
                width: 44px !important;
                height: 44px !important;
                padding: 0 !important;
                font-size: 14px !important;
                cursor: pointer !important;
                z-index: 2147483647 !important;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                transition: all 0.3s ease !important;
                opacity: 0.9 !important;
              }
              .watermark-remover-button:hover {
                width: auto !important;
                padding: 0 16px !important;
                border-radius: 22px !important;
                background-color: #3367d6 !important;
              }
              .watermark-remover-button .icon {
                display: inline-block !important;
                width: 24px !important;
                height: 24px !important;
                background-color: white !important;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%234285f4' d='M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z'/%3E%3C/svg%3E") !important;
                background-size: cover !important;
                background-position: center !important;
                background-repeat: no-repeat !important;
                margin: 0 !important;
                flex-shrink: 0 !important;
              }
              .watermark-remover-button:hover .icon {
                margin-right: 8px !important;
              }
              .watermark-remover-button .text {
                display: none !important;
                white-space: nowrap !important;
              }
              .watermark-remover-button:hover .text {
                display: inline-block !important;
              }
            `;
            document.head.appendChild(style);
          }
        }).then(() => {
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: new Function(INJECT_BUTTON_SCRIPT)
          }).catch(error => {
            console.error("Failed to inject button script:", error);
          });
        });
      });
    }
  }
});

// Listen for extension activation
chrome.action.onClicked.addListener((tab) => {
  // Send message to content script
  chrome.tabs.sendMessage(tab.id, {action: "processImages"}).catch(error => {
    console.log("Error sending processImages message:", error);
    // 注入处理脚本
    if (isSupportedSite(tab.url)) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // 显示提示，不自动处理图片
          function showSelectionHint() {
            // 创建并显示提示
            const hint = document.createElement('div');
            hint.style.position = 'fixed';
            hint.style.top = '50%';
            hint.style.left = '50%';
            hint.style.transform = 'translate(-50%, -50%)';
            hint.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            hint.style.color = 'white';
            hint.style.padding = '20px';
            hint.style.borderRadius = '8px';
            hint.style.zIndex = '2147483647';
            hint.style.textAlign = 'center';
            hint.style.fontSize = '16px';
            hint.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
            hint.innerHTML = '请<strong>按住Ctrl键并点击</strong>选择要下载的图片<br><span style="font-size:12px;opacity:0.7">点击此提示关闭</span>';
            
            // 点击提示关闭它
            hint.addEventListener('click', function() {
              document.body.removeChild(hint);
            });
            
            document.body.appendChild(hint);
            
            // 5秒后自动关闭
            setTimeout(() => {
              if (document.body.contains(hint)) {
                document.body.removeChild(hint);
              }
            }, 5000);
          }
          
          // 显示提示而不是自动下载
          showSelectionHint();
          
          // 向页面发送消息激活选择功能
          window.postMessage({type: 'WATERMARK_REMOVER_PROCESS'}, '*');
        }
      });
    }
  });
}); 