// Popup script for Watermark Remover

document.addEventListener('DOMContentLoaded', function() {
  // 获取UI元素
  const downloadButton = document.getElementById('downloadButton');
  const removeButton = document.getElementById('removeButton');
  const statusDiv = document.getElementById('status');
  
  // 显示状态信息的函数
  function showStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.classList.add('show');
    
    if (isError) {
      statusDiv.classList.add('error');
      statusDiv.classList.remove('success');
    } else {
      statusDiv.classList.add('success');
      statusDiv.classList.remove('error');
    }
    
    // 5秒后隐藏状态信息
    setTimeout(() => {
      statusDiv.classList.remove('show');
    }, 5000);
  }
  
  // 下载图片按钮点击事件
  downloadButton.addEventListener('click', function() {
    // 获取当前活动的选项卡
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs[0]) {
        // 发送下载图片消息到内容脚本
        chrome.tabs.sendMessage(tabs[0].id, {action: "downloadImages"}, function(response) {
          if (chrome.runtime.lastError) {
            showStatus('无法连接到页面，或当前页面不受支持', true);
            return;
          }
          
          if (response && response.status) {
            if (response.count === 0) {
              showStatus('没有找到可下载的图片', true);
            } else {
              showStatus(`正在下载 ${response.count} 张图片...`);
            }
          } else {
            showStatus('下载失败，请重试', true);
          }
        });
      } else {
        showStatus('无法获取当前页面信息', true);
      }
    });
  });
  
  // 去除水印按钮点击事件
  removeButton.addEventListener('click', function() {
    // 获取当前活动的选项卡
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs[0]) {
        // 发送处理图片消息到内容脚本
        chrome.tabs.sendMessage(tabs[0].id, {action: "processImages"}, function(response) {
          if (chrome.runtime.lastError) {
            showStatus('无法连接到页面，或当前页面不受支持', true);
            return;
          }
          
          if (response && response.status) {
            if (response.status.includes('处理')) {
              showStatus(response.status);
            } else {
              showStatus('图片处理完成');
            }
          } else {
            showStatus('处理失败，请重试', true);
          }
        });
      } else {
        showStatus('无法获取当前页面信息', true);
      }
    });
  });
  
  // 检查当前页面是否是支持的网站
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs && tabs[0]) {
      const url = tabs[0].url || '';
      const isSupportedSite = url.includes('doubao.com') || 
                              url.includes('jimeng.ai') || 
                              url.includes('byteimg.com') ||
                              url.includes('jianying.com');
      
      if (!isSupportedSite) {
        showStatus('当前网站不在支持列表中，功能可能受限', true);
      }
    }
  });
}); 