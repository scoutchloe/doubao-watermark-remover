// Content script for ByteDance Watermark Remover

// Function to remove watermark from URL
function removeWatermarkFromUrl(url) {
  // 简单日志记录
  console.log("Processing URL:", url);
  
  // 只有下载时才移除水印，不影响页面显示
  const isForDownload = arguments.length > 1 && arguments[1] === true;
  
  // 如果不是为了下载，直接返回原始URL，不做修改
  if (!isForDownload) {
    return url;
  }
  
  // 跳过处理jianying.com和byteimg.com域名的图片
  if (url.includes('jianying.com') || url.includes('byteimg.com')) {
    console.log("Skipping URL from jianying.com or byteimg.com");
    return url; // 直接返回原始URL，不做任何修改
  }
  
  // 处理豆包doubao.com图片URL
  if (url.includes('doubao.com') && url.includes('tplv-')) {
    console.log("Removing watermark from doubao.com image");
    return url.replace(/~tplv-[^&?]*(?=[&?]|$)/g, '');
  }
  
  // 处理即梦jimeng.ai图片URL  
  if (url.includes('jimeng.ai') && url.includes('tplv-')) {
    console.log("Removing watermark from jimeng.ai image");
    return url.replace(/~tplv-[^&?]*(?=[&?]|$)/g, '');
  }
  
  // 默认不改变URL
  return url;
}

// Function to process all images on the page
function processImages() {
  console.log('Processing images to remove watermarks');
  let modifiedCount = 0;
  
  // 跳过处理jianying.com网站上的图片
  if (window.location.hostname.includes('jianying.com')) {
    console.log("Skipping image processing on jianying.com");
    // showStatus("为避免图片加载错误，不处理即梦剪映网站上的图片");
    return 0;
  }
  
  // 创建已处理图片的Map，用于恢复失败的图片
  const processedImages = new Map();
  
  // 添加保护逻辑：仅当用户明确要求下载时才处理图片，不自动处理所有图片
  const autoProcessEnabled = false; // 默认不自动处理图片
  
  // 如果不自动处理，直接返回
  if (!autoProcessEnabled) {
    console.log("Auto processing disabled, only processing images when user clicks download button");
    return 0;
  }
  
  // Process all image elements - 只在用户明确要求时才执行
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    // 跳过已经隐藏的图片
    if (img.style.display === 'none' || img.style.visibility === 'hidden') {
      return;
    }
    
    // 只处理有src属性且符合条件的图片
    if (img.src && (
        img.src.includes('doubao.com') || 
        img.src.includes('jimeng.ai')
    ) && img.src.includes('tplv-')) {
      const originalSrc = img.src;
      const newSrc = removeWatermarkFromUrl(img.src);
      
      if (newSrc !== originalSrc) {
        // 保存原始src以便需要时恢复
        processedImages.set(img, originalSrc);
        
        // 设置新的src
        img.src = newSrc;
        modifiedCount++;
        
        // 监听图片加载错误，恢复原始URL
        img.onerror = function() {
          console.log("Image failed to load, reverting to original:", originalSrc);
          img.src = originalSrc;
          img.onerror = null; // 移除监听器以避免循环
        };
      }
    }
  });
  
  // Process all background images in style attributes
  const elementsWithBackground = document.querySelectorAll('[style*="background"]');
  elementsWithBackground.forEach(el => {
    const style = el.getAttribute('style');
    if (style && (
        style.includes('doubao.com') || 
        style.includes('jimeng.ai')
    ) && style.includes('tplv-')) {
      const originalStyle = style;
      const newStyle = style.replace(/url\(['"]?(.*?)['"]\)/g, (match, url) => {
        // 跳过处理jianying.com和byteimg.com域名的图片
        if (url.includes('jianying.com') || url.includes('byteimg.com')) {
          return match;
        }
        const newUrl = removeWatermarkFromUrl(url);
        return `url('${newUrl}')`;
      });
      
      if (newStyle !== originalStyle) {
        el.setAttribute('style', newStyle);
        modifiedCount++;
      }
    }
  });
  
  return modifiedCount;
}

// Function to show status message
function showStatus(message, duration = 3000) {
  let statusElement = document.getElementById('watermark-remover-status');
  
  if (!statusElement) {
    statusElement = document.createElement('div');
    statusElement.id = 'watermark-remover-status';
    statusElement.className = 'watermark-remover-status';
    document.body.appendChild(statusElement);
  }
  
  statusElement.textContent = message;
  statusElement.classList.add('show');
  
  setTimeout(() => {
    statusElement.classList.remove('show');
  }, duration);
}

// Function to check if we're on a supported site
function isOnSupportedSite() {
  const hostname = window.location.hostname;
  const href = window.location.href || "";
  console.log("Current hostname:", hostname, "Current URL:", href); // 详细日志
  
  // 特别处理jianying.com域名 - 只允许按钮显示，不处理图片
  if (hostname.includes('jianying.com') || hostname.includes('jimeng.jianying.com')) {
    console.log("Matched jianying.com domain (button only)");
    return true;
  }
  
  // 处理其他支持的域名
  return hostname.includes('doubao.com') || 
         hostname.includes('jimeng.ai');
}

// 完全重写downloadImage函数，解决下载失败问题
function downloadImage(imgSrc, filename) {
  console.log("开始下载图片:", imgSrc);
  
  // 处理图片URL，去除水印 - 只有下载时才进行
  let cleanSrc = imgSrc;
  
  // 创建一个新的Image对象来处理下载，不影响原始DOM
  const img = new Image();
  img.crossOrigin = 'anonymous'; // 尝试跨域加载
  
  // 图片加载成功时的处理
  img.onload = function() {
    try {
      // 创建canvas用于导出图片
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 绘制图片到canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // 导出为blob
      canvas.toBlob(function(blob) {
        if (blob) {
          const url = URL.createObjectURL(blob);
          // 使用a标签下载
          const a = document.createElement('a');
          a.href = url;
          a.download = filename || 'image_nowatermark.jpg';
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          
          // 清理资源
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
          
          showStatus(`已下载图片`);
        } else {
          console.error("Canvas转换为blob失败");
          showStatus(`下载失败: 无法创建图片数据`);
        }
      }, 'image/jpeg', 0.95);
    } catch (e) {
      console.error("Canvas处理失败:", e);
      showStatus(`下载失败: ${e.message}`);
    }
  };
  
  // 图片加载失败时的处理
  img.onerror = function() {
    console.error("图片加载失败，尝试降级处理");
    
    // 尝试不使用canvas直接下载
    try {
      const a = document.createElement('a');
      a.href = imgSrc;
      a.download = filename || 'image_nowatermark.jpg';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);
      
      showStatus(`已尝试直接下载图片`);
    } catch (e) {
      console.error("直接下载失败:", e);
      showStatus(`下载失败: ${e.message}`);
    }
  };
  
  // 设置src开始加载图片
  img.src = cleanSrc;
}

// 从URL中提取文件名
function getFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;
    // 获取路径最后部分作为文件名
    let filename = pathname.split('/').pop() || 'image.jpg';
    // 移除查询参数
    filename = filename.split('?')[0];
    // 如果没有扩展名，添加.jpg
    if (!filename.includes('.')) {
      filename += '.jpg';
    }
    return filename;
  } catch (e) {
    return 'image.jpg';
  }
}

// 备用下载方式
function tryDownloadWithBackup(cleanSrc, originalSrc, filename) {
  // 方法1：使用img元素加载
  const img = new Image();
  img.crossOrigin = 'anonymous'; // 尝试跨域加载
  img.onload = function() {
    try {
      // 创建canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 绘制图片到canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // 导出为blob
      canvas.toBlob(function(blob) {
        if (blob) {
          const url = URL.createObjectURL(blob);
          downloadWithLink(url, filename || getFilenameFromUrl(cleanSrc));
          URL.revokeObjectURL(url);
          showStatus(`已下载图片`);
        } else {
          console.error("Canvas转换为blob失败");
          tryDirectDownload(originalSrc, filename);
        }
      }, 'image/jpeg', 0.95);
    } catch (e) {
      console.error("Canvas处理失败:", e);
      tryDirectDownload(originalSrc, filename);
    }
  };
  
  img.onerror = function() {
    console.error("图片加载失败，尝试直接下载原始图片");
    tryDirectDownload(originalSrc, filename);
  };
  
  // 设置src开始加载
  img.src = cleanSrc;
  
  // 如果5秒后仍未加载完成，尝试原始URL
  setTimeout(function() {
    if (!img.complete) {
      console.log("图片加载超时，尝试原始URL");
      img.src = originalSrc;
    }
  }, 5000);
}

// 最直接的下载方式
function tryDirectDownload(imgSrc, filename) {
  console.log("尝试直接下载:", imgSrc);
  
  // 方法: 直接通过a标签下载
  const a = document.createElement('a');
  a.href = imgSrc;
  a.download = filename || 'image.jpg';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  
  // 延迟移除
  setTimeout(() => {
    document.body.removeChild(a);
  }, 100);
  
  showStatus(`已尝试直接下载图片`);
}

// 通用下载链接方法
function downloadWithLink(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  
  // 延迟移除
  setTimeout(() => {
    document.body.removeChild(a);
  }, 100);
}

// 添加变量以跟踪当前选中的图片
let selectedImage = null;

// 添加变量以跟踪悬浮球状态
let buttonDragging = false;
let buttonOffset = { x: 0, y: 0 };
// 修改默认位置 - 右侧1/3
let buttonPosition = { y: 20 }; // 只存储y坐标，x由屏幕宽度计算

// 添加全局拖动状态跟踪变量
let globalIsDragging = false;

// 添加变量以控制下载状态，防止重复下载
let isDownloading = false;

// 添加追踪图片选择的功能
function setupImageSelection() {
  // 获取页面上所有符合条件的图片
  const allImages = document.querySelectorAll('img');
  
  // 添加全局提示
  let globalHint = document.getElementById('global-image-selection-hint');
  if (!globalHint && allImages.length > 0) {
    globalHint = document.createElement('div');
    globalHint.id = 'global-image-selection-hint';
    globalHint.style.position = 'fixed';
    globalHint.style.bottom = '20px';
    globalHint.style.right = '20px';
    globalHint.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    globalHint.style.color = 'white';
    globalHint.style.padding = '8px 12px';
    globalHint.style.borderRadius = '4px';
    globalHint.style.zIndex = '2147483646';
    globalHint.style.transition = 'opacity 0.5s';
    globalHint.style.fontSize = '14px';
    globalHint.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    globalHint.textContent = '按住Ctrl键并点击图片选择要下载的图片';
    document.body.appendChild(globalHint);
    
    // 5秒后自动淡出
    setTimeout(() => {
      globalHint.style.opacity = '0';
      setTimeout(() => {
        if (globalHint.parentNode) {
          globalHint.parentNode.removeChild(globalHint);
        }
      }, 500);
    }, 5000);
  }
  
  // 为每个图片添加点击事件
  allImages.forEach(img => {
    // 判断是否为支持的网站图片，且图片足够大
    if (img.src && 
        (img.src.includes('doubao.com') || 
         img.src.includes('jimeng.ai') ||
         img.src.includes('byteimg.com') ||
         img.src.includes('jianying.com')) &&
        img.naturalWidth >= 100 && 
        img.naturalHeight >= 100) {
      
      // 只添加鼠标悬停效果，不阻止原始点击事件
      if (!img.classList.contains('selectable-image')) {
        img.classList.add('selectable-image');
      
        // 添加鼠标悬停效果
        img.addEventListener('mouseenter', function() {
          // 仅显示提示，不添加高亮边框，避免干扰
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
          
          hint.textContent = '按住Ctrl键并点击选择此图片下载';
          hint.style.opacity = '1';
        });
        
        // 移除鼠标悬停效果
        img.addEventListener('mouseleave', function() {
          // 如果不是选中的图片，移除高亮
          if (this !== selectedImage) {
            this.style.outline = 'none';
          }
          
          // 隐藏提示
          const hint = document.getElementById('image-selection-hint');
          if (hint) {
            hint.style.opacity = '0';
          }
        });
        
        // 使用Ctrl+点击选择图片，不阻止原始点击事件
        img.addEventListener('click', function(e) {
          // 只有当按下Ctrl键时才处理我们的选择逻辑
          if (e.ctrlKey) {
            // 阻止默认行为和事件冒泡
            e.preventDefault();
            e.stopPropagation();
            
            // 移除之前选中图片的高亮
            if (selectedImage) {
              selectedImage.style.outline = 'none';
              selectedImage.classList.remove('selected');
            }
            
            // 设置当前图片为选中
            selectedImage = this;
            this.style.outline = '3px solid #4285f4';
            this.classList.add('selected');
            
            showStatus('已选择图片，点击右上角按钮下载');
            
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
          }
          // 不按Ctrl点击时，不执行我们的逻辑，让事件继续传播
        });
      }
    }
  });
}

// 修改添加悬浮球函数，优化事件处理
function addFloatingButton() {
  // 检查是否已存在按钮
  if (document.getElementById('watermark-remover-button')) {
    console.log("Button already exists, not adding again");
    return;
  }
  
  // 检查是否在支持的网站上
  if (!isOnSupportedSite()) {
    console.log("Not on supported site, not adding button");
    return;
  }
  
  console.log("On supported site, adding button");
  
  try {
    // 创建按钮容器 - 用于扩大点击区域
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'watermark-remover-container';
    buttonContainer.style.position = 'fixed';
    buttonContainer.style.zIndex = '9999998'; // 比按钮低一级
    buttonContainer.style.pointerEvents = 'all';
    // 添加容器基础样式
    buttonContainer.style.transition = 'all 0.3s ease';
    buttonContainer.style.width = '44px';
    buttonContainer.style.height = '44px';
    buttonContainer.style.borderRadius = '50%';
    buttonContainer.style.backgroundColor = 'transparent'; // 透明背景
    buttonContainer.style.cursor = 'pointer';
    
    // 创建按钮
    const button = document.createElement('button');
    button.id = 'watermark-remover-button';
    button.className = 'watermark-remover-button';
    
    // 添加图标
    const icon = document.createElement('span');
    icon.className = 'icon';
    button.appendChild(icon);
    
    // 添加文本（放入单独的span中以便控制显示）
    const text = document.createElement('span');
    text.className = 'text';
    text.textContent = '豆包、即梦图片无水印下载';
    button.appendChild(text);
    
    // 只为容器添加点击事件，避免重复触发
    buttonContainer.addEventListener('click', function(e) {
      // 停止事件冒泡，防止触发按钮的点击事件
      e.stopPropagation();
      
      console.log("按钮容器点击事件被触发");
      
      // 如果是拖动状态或已经在下载中，不处理点击
      if (globalIsDragging || isDownloading) {
        console.log("忽略点击，因为正在拖动或已经在下载中");
        return;
      }
      
      // 设置下载状态为正在下载
      isDownloading = true;
      
      // 执行下载操作
      console.log("通过容器调用downloadSelectedImage函数");
      try {
        const count = downloadSelectedImage();
        console.log("下载函数返回值:", count);
        if (count > 0) {
          showStatus('正在下载选中的图片...');
        } else {
          showStatus('未找到可下载的图片');
        }
      } catch (error) {
        console.error("下载出错:", error);
        showStatus('下载出错: ' + error.message);
      }
      
      // 延迟重置下载状态，防止短时间内重复点击
      setTimeout(() => {
        isDownloading = false;
      }, 1000);
    });
    
    // 为按钮添加hover事件，同步更新容器大小
    button.addEventListener('mouseenter', function() {
      // 当按钮展开时，同步扩展容器大小
      setTimeout(() => {
        const buttonWidth = window.getComputedStyle(button).width;
        const buttonHeight = window.getComputedStyle(button).height;
        const buttonBorderRadius = window.getComputedStyle(button).borderRadius;
        
        buttonContainer.style.width = buttonWidth;
        buttonContainer.style.height = buttonHeight;
        buttonContainer.style.borderRadius = buttonBorderRadius;
        
        addDebugMessage("扩展容器大小: " + buttonWidth + "x" + buttonHeight);
      }, 10); // 使用较短的延迟确保能及时捕获到按钮展开
    });
    
    button.addEventListener('mouseleave', function() {
      // 当按钮收缩时，延迟一段时间后收缩容器
      setTimeout(() => {
        // 检查鼠标是否真的离开了整个区域
        if (!buttonContainer.matches(':hover')) {
          buttonContainer.style.width = '44px';
          buttonContainer.style.height = '44px';
          buttonContainer.style.borderRadius = '50%';
          
          addDebugMessage("收缩容器大小: 44x44");
        }
      }, 300); // 等待过渡动画完成
    });
    
    // 按钮本身不再添加点击事件，避免重复触发
    // 阻止按钮点击冒泡到容器
    button.addEventListener('click', function(e) {
      // 阻止事件冒泡
      e.stopPropagation();
    });
    
    // 添加title属性作为工具提示
    button.title = '豆包、即梦网址图片无水印下载';
    
    // 确保body元素存在
    if (document.body) {
      // 将按钮添加到容器中
      buttonContainer.appendChild(button);
      // 将容器添加到页面
      document.body.appendChild(buttonContainer);
      console.log("Button and container added to page");
      
      // 设置图片选择
      setupImageSelection();
      
      // 恢复保存的位置
      chrome.storage.local.get(['buttonPositionY'], function(result) {
        if (chrome.runtime.lastError) {
          addDebugMessage("读取位置失败: " + chrome.runtime.lastError.message);
          // 默认垂直位置居中
          buttonPosition.y = Math.round((window.innerHeight - button.offsetHeight) / 2);
        } else if (result.buttonPositionY !== undefined) {
          buttonPosition.y = result.buttonPositionY;
          addDebugMessage("已恢复按钮位置: Y=" + buttonPosition.y);
        } else {
          // 默认垂直位置居中
          buttonPosition.y = Math.round((window.innerHeight - button.offsetHeight) / 2);
          addDebugMessage("设置默认按钮位置: Y=" + buttonPosition.y);
        }
        
        // 强制应用位置
        updateButtonPositionForce(button);
        
        // 添加替代的拖动处理
        setTimeout(function() {
          addDragHandling();
        }, 500);
      });
      
      // 窗口大小变化时更新位置
      window.addEventListener('resize', function() {
        updateButtonPositionForce();
      });
    } else {
      console.log("Body element not found, button not added");
      // 如果body不存在，稍后再试
      setTimeout(tryAddButton, 500);
    }
  } catch (error) {
    console.error("Error adding button:", error);
  }
}

// 鼠标移动处理 - 限制只能垂直移动
function handleMouseMove(e) {
  if (!buttonDragging) return;
  
  const button = document.getElementById('watermark-remover-button');
  if (!button) return;
  
  // 只更新Y坐标
  buttonPosition.y = e.clientY - buttonOffset.y;
  
  // 确保不超出垂直边界
  buttonPosition.y = Math.max(0, Math.min(window.innerHeight - button.offsetHeight, buttonPosition.y));
  
  // 直接更新位置，不使用函数
  button.style.top = `${buttonPosition.y}px`;
  
  // 防止按钮悬停状态改变
  e.preventDefault();
  e.stopPropagation();
}

// 鼠标释放处理
function handleMouseUp(e) {
  if (!buttonDragging) return;
  
  console.log("结束拖动悬浮球");
  buttonDragging = false;
  
  const button = document.getElementById('watermark-remover-button');
  if (button) {
    button.style.cursor = 'ns-resize'; // 保持为上下拖动光标
  }
  
  // 保存按钮垂直位置
  chrome.storage.local.set({
    buttonPositionY: buttonPosition.y
  });
  
  // 防止按钮悬停状态改变
  e.preventDefault();
  e.stopPropagation();
}

// 更新按钮位置 - 限制只能在右侧垂直移动
function updateButtonPosition(button) {
  // 设置右侧固定位置 - 屏幕宽度的1/3处
  const rightPosition = Math.round(window.innerWidth / 3);
  
  button.style.top = `${buttonPosition.y}px`;
  button.style.left = 'auto';
  button.style.right = `${rightPosition}px`;
}

// 确保在页面完成加载后立即尝试添加按钮
function tryAddButton() {
  addFloatingButton();
  
  // 如果按钮没有添加成功，再次尝试（可能页面DOM还未完全加载）
  if (!document.getElementById('watermark-remover-button') && isOnSupportedSite()) {
    setTimeout(tryAddButton, 1000); // 1秒后再次尝试
  }
}

// 修改监听消息的处理函数
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "processImages") {
    // 不自动处理图片，而是提示用户选择
    showStatus('请按住Ctrl键并点击选择您要下载的图片');
    setupImageSelection();
    sendResponse({status: "已准备好图片选择功能"});
  } else if (message.action === "checkButton") {
    console.log("Received checkButton message for URL:", message.url);
    // 确保按钮存在
    if (!document.getElementById('watermark-remover-button')) {
      console.log("Button not found, trying to add it");
      tryAddButton();
      setTimeout(() => {
        const buttonExists = !!document.getElementById('watermark-remover-button');
        console.log("Button exists after retry:", buttonExists);
        sendResponse({buttonExists: buttonExists});
      }, 500);
    } else {
      console.log("Button already exists");
      sendResponse({buttonExists: true});
    }
    return true; // 保持消息通道开放以进行异步响应
  } else if (message.action === "downloadImages") {
    // 如果没有选择图片，提示用户先选择图片
    if (!selectedImage) {
      showStatus('请先按住Ctrl键并点击选择要下载的图片');
      setupImageSelection();
      sendResponse({status: "请先选择图片", count: 0});
    } else {
      // 下载选中图片
      const count = downloadSelectedImage();
      sendResponse({status: "已开始下载选中图片", count: count});
    }
    return true;
  }
});

// 监听来自注入脚本的消息
window.addEventListener('message', (event) => {
  // 确保消息来自同一窗口
  if (event.source !== window) return;
  
  // 处理水印去除消息
  if (event.data && event.data.type === 'WATERMARK_REMOVER_PROCESS') {
    console.log("Received WATERMARK_REMOVER_PROCESS message from injected script");
    
    // 在即梦剪映网站上显示特殊提示
    if (window.location.hostname.includes('jianying.com')) {
      showStatus("为避免图片加载错误，不处理即梦剪映网站上的图片");
      return;
    }
    
    // 修改为下载选中图片，不要自动选择
    if (!selectedImage) {
      showStatus('请先按住Ctrl键并点击选择要下载的图片');
      setupImageSelection();
    } else {
      const count = downloadSelectedImage();
      if (count === 0) {
        showStatus('没有找到可下载的图片');
      }
    }
  }
});

// 修复MutationObserver的错误，确保只在body存在时才进行观察
function startMutationObserver() {
  // 确保document.body存在
  if (!document.body) {
    console.log("Body element not found, will try to start observer later");
    // 如果body不存在，延迟再次尝试
    setTimeout(startMutationObserver, 500);
    return;
  }
  
  console.log("Starting MutationObserver on document.body");
  // Set up MutationObserver to handle dynamically loaded images
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    let newImages = false;
    
    mutations.forEach(mutation => {
      // Check if new nodes were added
      if (mutation.addedNodes.length > 0) {
        shouldProcess = true;
        
        // 检查是否有新增的图片元素
        mutation.addedNodes.forEach(node => {
          if (node.tagName === 'IMG') {
            newImages = true;
          } else if (node.querySelectorAll) {
            const images = node.querySelectorAll('img');
            if (images.length > 0) {
              newImages = true;
            }
          }
        });
      }
    });
    
    if (shouldProcess) {
      // 不自动处理图片，只确保按钮存在
      // processImages(); // 注释掉自动处理图片的代码
      
      // 如果有新图片并且我们已经设置过选择图片功能，更新选择图片功能
      if (newImages && document.querySelector('.selectable-image')) {
        setupImageSelection();
      }
      
      // 检查按钮是否存在，如果不存在则尝试添加
      if (!document.getElementById('watermark-remover-button') && isOnSupportedSite()) {
        tryAddButton();
      }
    }
  });

  // Start observing the document
  try {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    console.log("MutationObserver started successfully");
  } catch (error) {
    console.error("Failed to start MutationObserver:", error);
  }
}

// Run when the document is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // 不自动处理图片，避免干扰网页正常显示
    // processImages(); // 注释掉自动处理图片的代码
    tryAddButton();
    startMutationObserver();
  });
} else {
  // processImages(); // 注释掉自动处理图片的代码
  tryAddButton();
  startMutationObserver();
}

// 页面加载完成后再次检查
window.addEventListener('load', () => {
  // processImages(); // 注释掉自动处理图片的代码
  tryAddButton();
  
  // 确保MutationObserver正在运行
  if (!document.getElementById('watermark-observer-active')) {
    const marker = document.createElement('div');
    marker.id = 'watermark-observer-active';
    marker.style.display = 'none';
    document.body.appendChild(marker);
    startMutationObserver();
  }
});

// 不要在这里直接启动MutationObserver，改为调用函数
// observer.observe(document.body, {
//   childList: true,
//   subtree: true
// });

// 立即尝试添加按钮
tryAddButton();

// 添加CSS样式
function addCustomStyles() {
  const style = document.createElement('style');
  style.textContent = `
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
    
    /* 修改按钮样式，支持垂直拖动 */
    .watermark-remover-button {
      transition: background-color 0.3s ease;
      user-select: none;
      touch-action: none;
      cursor: grab;
    }
    
    .watermark-remover-button:active {
      cursor: ns-resize;
    }
  `;
  document.head.appendChild(style);
}

// 初始化函数
function initialize() {
  addCustomStyles();
  setupImageSelection();
}

// 在页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// 在页面卸载时清理事件监听
window.addEventListener('beforeunload', cleanup);

// 清理事件监听器
function cleanup() {
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  window.removeEventListener('beforeunload', cleanup);
  window.removeEventListener('resize', updateButtonPosition);
}

// 初始化时向页面添加调试消息
function addDebugMessage(message) {
  console.log("DEBUG: " + message);
  
  // 显示到界面上的调试消息
  let debugElem = document.getElementById('watermark-debug');
  if (!debugElem) {
    debugElem = document.createElement('div');
    debugElem.id = 'watermark-debug';
    debugElem.style.position = 'fixed';
    debugElem.style.bottom = '10px';
    debugElem.style.left = '10px';
    debugElem.style.backgroundColor = 'rgba(0,0,0,0.7)';
    debugElem.style.color = 'white';
    debugElem.style.padding = '5px 10px';
    debugElem.style.borderRadius = '4px';
    debugElem.style.zIndex = '9999999';
    debugElem.style.fontSize = '12px';
    debugElem.style.fontFamily = 'monospace';
    document.body.appendChild(debugElem);
  }
  
  debugElem.textContent = message;
  
  // 3秒后自动消失
  setTimeout(() => {
    if (debugElem && debugElem.parentNode) {
      debugElem.textContent = '';
    }
  }, 3000);
}

// 强制更新按钮位置 - 不依赖CSS，固定在右侧边缘
function updateButtonPositionForce(button) {
  if (!button) {
    button = document.getElementById('watermark-remover-button');
    if (!button) {
      addDebugMessage("找不到按钮元素，无法更新位置");
      return;
    }
  }
  
  // 获取容器元素
  const container = document.getElementById('watermark-remover-container');
  
  // 设置右侧边缘固定位置
  const rightPosition = 20; // 固定在屏幕右侧边缘20px处
  
  // 直接设置样式 - 使用!important
  button.style.setProperty('top', buttonPosition.y + 'px', 'important');
  button.style.setProperty('left', 'auto', 'important');
  button.style.setProperty('right', rightPosition + 'px', 'important');
  
  // 同步容器位置
  if (container) {
    container.style.setProperty('top', buttonPosition.y + 'px', 'important');
    container.style.setProperty('left', 'auto', 'important');
    container.style.setProperty('right', rightPosition + 'px', 'important');
  }
  
  addDebugMessage("位置已强制更新: Y=" + buttonPosition.y + ", 右边距=" + rightPosition + "px");
}

// 在点击处理函数中获取正确的按钮元素
function addDragHandling() {
  // 清除之前可能存在的事件
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  
  // 获取按钮元素
  const button = document.getElementById('watermark-remover-button');
  if (!button) {
    addDebugMessage("找不到按钮元素，无法添加拖动功能");
    return;
  }
  
  // 获取容器元素
  const container = document.getElementById('watermark-remover-container');
  if (!container) {
    addDebugMessage("找不到容器元素，无法完全扩展点击区域");
  }
  
  // 强制设置按钮初始位置
  if (!buttonPosition.y) {
    buttonPosition.y = Math.round((window.innerHeight - button.offsetHeight) / 2);
  }
  
  // 立即应用位置
  updateButtonPositionForce(button);
  addDebugMessage("初始位置设置: Y=" + buttonPosition.y);
  
  // 使用直接事件处理而不是全局事件
  let isDragging = false;
  let dragStartTime = 0;
  let initialX, initialY;
  
  // 为容器和按钮都添加拖动功能，确保两者都能用于拖动
  if (container) {
    // 容器拖动处理 - 同样可以用于拖动
    container.onmousedown = startDrag;
  }
  
  // 按钮拖动处理
  button.onmousedown = startDrag;
  
  // 统一的拖动启动函数
  function startDrag(e) {
    // 只允许左键拖动
    if (e.button !== 0) return;
    
    // 记录初始位置
    initialX = e.clientX;
    initialY = e.clientY;
    isDragging = false; // 先不认为是拖动，等移动一定距离才算
    globalIsDragging = false;
    dragStartTime = Date.now();
    
    // 更改光标样式
    button.style.cursor = 'ns-resize';
    if (container) container.style.cursor = 'ns-resize';
    
    e.preventDefault();
    e.stopPropagation();
    
    // 使用document级别事件处理移动
    document.onmousemove = function(e) {
      // 计算移动距离
      const moveX = Math.abs(e.clientX - initialX);
      const moveY = Math.abs(e.clientY - initialY);
      
      // 只有移动超过5像素才认为是拖动
      if (!isDragging && (moveX > 5 || moveY > 5)) {
        isDragging = true;
        globalIsDragging = true;
        addDebugMessage("开始拖动");
      }
      
      if (!isDragging) return;
      
      // 拖动过程中重置全局拖动状态
      globalIsDragging = true;
      
      // 直接使用鼠标的Y坐标，确保按钮跟随鼠标移动
      const newTop = Math.max(0, Math.min(window.innerHeight - button.offsetHeight, e.clientY - (button.offsetHeight / 2)));
      
      // 直接设置位置 - 同步更新按钮和容器
      button.style.setProperty('top', newTop + 'px', 'important');
      if (container) {
        container.style.setProperty('top', newTop + 'px', 'important');
      }
      buttonPosition.y = newTop;
      
      addDebugMessage("拖动中: mouseY=" + e.clientY + ", newTop=" + newTop);
      
      e.preventDefault();
      e.stopPropagation();
    };
    
    document.onmouseup = function(e) {
      // 如果没有拖动，且移动距离小，认为是点击
      if (!isDragging && Date.now() - dragStartTime < 300) {
        const moveX = Math.abs(e.clientX - initialX);
        const moveY = Math.abs(e.clientY - initialY);
        
        if (moveX < 5 && moveY < 5) {
          addDebugMessage("检测到点击 (不是拖动)");
          globalIsDragging = false;
          
          // 如果正在下载，不再触发新的下载
          if (isDownloading) {
            addDebugMessage("忽略点击，已经在下载中");
            return;
          }
          
          // 设置下载状态
          isDownloading = true;
          
          // 如果容器或按钮被点击
          if (e.target === button || e.target.closest('#watermark-remover-button') || 
              e.target === container || e.target.closest('#watermark-remover-container')) {
            try {
              const count = downloadSelectedImage();
              console.log("点击调用下载函数，返回值:", count);
              if (count > 0) {
                showStatus('正在下载选中的图片...');
              } else {
                showStatus('未找到可下载的图片');
              }
            } catch (error) {
              console.error("下载出错:", error);
              showStatus('下载出错: ' + error.message);
            }
          }
          
          // 延迟重置下载状态
          setTimeout(() => {
            isDownloading = false;
          }, 1000);
        }
      } else if (isDragging) {
        isDragging = false;
        
        // 更改回正常光标
        button.style.cursor = 'pointer';
        if (container) container.style.cursor = 'pointer';
        
        // 延迟重置全局拖动状态，防止误触发点击事件
        setTimeout(function() {
          globalIsDragging = false;
        }, 300);
        
        // 确保位置被更新并保存
        updateButtonPositionForce(button);
        
        // 保存位置到storage
        chrome.storage.local.set({
          buttonPositionY: buttonPosition.y
        }, function() {
          if (chrome.runtime.lastError) {
            addDebugMessage("保存位置失败: " + chrome.runtime.lastError.message);
          } else {
            addDebugMessage("结束拖动: 位置已保存 Y=" + buttonPosition.y);
          }
        });
      }
      
      // 移除临时事件
      document.onmousemove = null;
      document.onmouseup = null;
      
      e.preventDefault();
      e.stopPropagation();
    };
  }
}

// 确保修改的downloadSelectedImage函数能正常工作
function downloadSelectedImage() {
  console.log('尝试下载选中图片...');
  
  // 如果正在拖动，则不下载
  if (globalIsDragging) {
    addDebugMessage("正在拖动中，不执行下载操作");
    return 0;
  }
  
  // 如果没有选中图片，提示用户需要先选择图片，不要自动选择
  if (!selectedImage) {
    showStatus('请先按住Ctrl键并点击选择要下载的图片', 4000);
    setupImageSelection(); // 确保所有图片可选
    
    // 显示额外的视觉提示，引导用户点击图片
    let hint = document.getElementById('image-selection-main-hint');
    if (!hint) {
      hint = document.createElement('div');
      hint.id = 'image-selection-main-hint';
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
      hint.style.maxWidth = '80%';
      hint.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
      hint.style.fontSize = '16px';
      hint.innerHTML = `
        <div style="margin-bottom:15px;font-weight:bold">请先选择要下载的图片</div>
        <div><strong>按住Ctrl键并点击</strong>页面上的图片将其选中，<br>然后再点击右侧下载按钮</div>
        <div style="margin-top:20px;font-size:12px;opacity:0.7">点击此提示关闭</div>
      `;
      
      // 点击提示关闭它
      hint.addEventListener('click', function() {
        hint.style.display = 'none';
      });
      
      document.body.appendChild(hint);
      
      // 5秒后自动关闭
      setTimeout(() => {
        if (hint && hint.parentNode) {
          hint.style.opacity = '0';
          hint.style.transition = 'opacity 0.5s';
          setTimeout(() => {
            if (hint && hint.parentNode) {
              hint.parentNode.removeChild(hint);
            }
          }, 500);
        }
      }, 5000);
    }
    
    return 0;
  }
  
  // 不修改原始图片的src，而是创建一个新的下载链接
  try {
    // 下载选中的图片 - 不修改原图，只下载处理后的版本
    const originalSrc = selectedImage.src;
    const cleanSrc = removeWatermarkFromUrl(originalSrc, true); // 传入true表示是为了下载处理
    const filename = 'image_nowatermark' + new Date().getTime() + '.jpg';
    
    // 使用独立的下载函数，不影响原始图片显示
    downloadImage(cleanSrc, filename);
    showStatus('正在下载选中的图片...');
    
    // 添加下载成功的视觉反馈
    if (selectedImage) {
      // 创建闪烁效果
      const originalOutline = selectedImage.style.outline;
      selectedImage.style.outline = '5px solid #4CAF50';
      selectedImage.style.transition = 'outline 0.3s';
      
      setTimeout(() => {
        selectedImage.style.outline = originalOutline;
      }, 1000);
    }
    
    return 1;
  } catch (error) {
    console.error("下载图片时出错:", error);
    showStatus('下载失败: ' + error.message);
    return 0;
  }
} 