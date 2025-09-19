document.addEventListener('DOMContentLoaded', () => {
    // DOM元素缓存
    const dom = {
        tabs: document.querySelectorAll('.tab'),
        tabContents: document.querySelectorAll('.tab-content'),
        inputLinks: document.getElementById('inputLinks'),
        outputCode: document.getElementById('outputCode'),
        previewContainer: document.getElementById('previewContainer'),
        // 按钮
        formatBtn: document.getElementById('formatBtn'),
        extractBtn: document.getElementById('extractBtn'),
        deduplicateBtn: document.getElementById('deduplicateBtn'),
        clearBtn: document.getElementById('clearBtn'),
        generateBtn: document.getElementById('generateBtn'),
        copyBtn: document.getElementById('copyBtn'),
        exportBtn: document.getElementById('exportBtn'),
        importBtn: document.getElementById('importBtn'),
        fileInput: document.getElementById('fileInput'),
        applyReplaceBtn: document.getElementById('applyReplaceBtn'),
        checkLinksBtn: document.getElementById('checkLinksBtn'),
        togglePreviewBtn: document.getElementById('togglePreviewBtn'),
        // 模态框
        modal: document.getElementById('modal'),
        closeModal: document.getElementById('closeModal'),
        modalTitle: document.getElementById('modalTitle'),
        modalContent: document.getElementById('modalContent'),
        modalCancelBtn: document.getElementById('modalCancelBtn'),
        modalConfirmBtn: document.getElementById('modalConfirmBtn')
    };

    // 图片链接正则表达式
    const IMG_LINK_REGEX = /(https?:\/\/[^\s'"]+\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?[^\s'"]*)?)/gi;
    
    // 当前预览模式
    let previewMode = 'grid';

    // 标签页切换功能 - 支持多个独立的标签栏
    dom.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            const tabContainer = tab.parentElement;
            
            // 获取同一标签栏中的所有标签
            const siblingTabs = Array.from(tabContainer.children);
            
            // 移除同一标签栏中所有标签的激活状态
            siblingTabs.forEach(t => t.classList.remove('active'));
            
            // 激活当前标签
            tab.classList.add('active');
            
            // 判断是主标签栏还是结果/预览标签栏
            // 通过检查tabContainer的位置关系来判断
            const isMainTabs = tabContainer.closest('main') && 
                              tabContainer.previousElementSibling === null; // 主标签栏在main的第一个位置
            
            const isResultTabs = tabContainer.hasAttribute('style') && 
                                tabContainer.getAttribute('style').includes('margin-top: 1.5rem');
            
            // 主标签栏的内容区域
            if (isMainTabs) {
                // 隐藏所有主标签内容
                document.querySelectorAll('#input-tab, #settings-tab, #replace-tab').forEach(content => {
                    content.classList.remove('active');
                });
                // 显示对应内容
                const contentElement = document.getElementById(`${tabId}-tab`);
                if (contentElement) contentElement.classList.add('active');
            }
            // 结果和预览标签栏
            else if (isResultTabs) {
                // 隐藏结果和预览内容
                document.querySelectorAll('#output-tab, #preview-tab').forEach(content => {
                    content.classList.remove('active');
                });
                // 显示对应内容
                const contentElement = document.getElementById(`${tabId}-tab`);
                if (contentElement) contentElement.classList.add('active');
            }
        });
    });

    // 显示通知
    function showNotification(message, type = 'info', duration = 3000) {
        // 移除现有的通知
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // 创建新通知
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // 添加图标
        const icon = document.createElement('i');
        switch (type) {
            case 'success':
                icon.className = 'fas fa-check-circle';
                break;
            case 'error':
                icon.className = 'fas fa-exclamation-circle';
                break;
            case 'warning':
                icon.className = 'fas fa-exclamation-triangle';
                break;
            case 'info':
            default:
                icon.className = 'fas fa-info-circle';
        }
        
        notification.appendChild(icon);
        notification.appendChild(document.createTextNode(message));
        document.body.appendChild(notification);

        // 添加动画效果
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            notification.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            
            // 移除通知
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // 自动整理功能
    dom.formatBtn.addEventListener('click', () => {
        const text = dom.inputLinks.value.trim();
        if (!text) {
            showNotification('请先输入图片链接', 'warning');
            return;
        }
        
        // 分割文本，处理各种可能的分隔符
        const links = text.split(/[\n\r,;\s]+/)
            .map(link => link.trim())
            .filter(link => link.length > 0);
            
        dom.inputLinks.value = links.join('\n');
        showNotification('链接已整理完成', 'success');
    });

    // 智能提取链接
    dom.extractBtn.addEventListener('click', () => {
        const text = dom.inputLinks.value.trim();
        if (!text) {
            showNotification('请先输入包含图片链接的文本', 'warning');
            return;
        }
        
        const matches = text.match(IMG_LINK_REGEX);
        if (!matches || matches.length === 0) {
            showNotification('未找到有效的图片链接', 'error');
            return;
        }
        
        dom.inputLinks.value = matches.join('\n');
        showNotification(`已提取 ${matches.length} 个图片链接`, 'success');
    });

    // 去除重复链接
    dom.deduplicateBtn.addEventListener('click', () => {
        const links = dom.inputLinks.value.trim().split('\n')
            .map(link => link.trim())
            .filter(link => link.length > 0);
            
        if (links.length === 0) {
            showNotification('请先输入图片链接', 'warning');
            return;
        }
        
        const uniqueLinks = [...new Set(links)];
        const removedCount = links.length - uniqueLinks.length;
        
        dom.inputLinks.value = uniqueLinks.join('\n');
        showNotification(`已移除 ${removedCount} 个重复链接`, 'success');
    });

    // 清空输入
    dom.clearBtn.addEventListener('click', () => {
        dom.inputLinks.value = '';
        showNotification('已清空输入区域', 'info');
    });

    // 更新预览
    function updatePreview(links) {
        if (!links || links.length === 0) {
            dom.previewContainer.innerHTML = `
                <div class="text-center" style="grid-column: 1 / -1; padding: 3rem;">
                    <i class="fas fa-images" style="font-size: 3rem; color: #dee2e6; margin-bottom: 1rem;"></i>
                    <p style="color: var(--secondary-dark);">请先生成HTML代码</p>
                </div>
            `;
            return;
        }

        dom.previewContainer.innerHTML = '';
        
        links.forEach((link, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            const img = document.createElement('img');
            img.src = link;
            img.className = 'preview-img';
            img.alt = `图片 ${index + 1}`;
            img.onerror = function() {
                img.src = 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22 width%3d%22200%22 height%3d%22150%22 viewBox%3d%220 0 200 150%22 preserveAspectRatio%3d%22none%22%3e%3cdefs%3e%3cstyle type%3d%22text%2fcss%22%3e%23holder_18b97f7a1e5 text %7b fill%3argb(204,204,204)%3bfont-weight%3anormal%3bfont-family%3aHelvetica%2c%20monospace%3bfont-size%3a10pt%20%7d%20%3c%2fstyle%3e%3c%2fdefs%3e%3cg id%3d%22holder_18b97f7a1e5%22%3e%3crect width%3d%22200%22 height%3d%22150%22 fill%3d%22%23f5f5f5%22%3e%3c%2frect%3e%3cg%3e%3ctext x%3d%2274.41015625%22 y%3d%2281%22%3e图片无法加载%3c%2ftext%3e%3c%2fg%3e%3c%2fg%3e%3c%2fsvg%3e';
                img.style.opacity = '0.5';
            };
            
            const caption = document.createElement('div');
            caption.className = 'preview-caption';
            
            // 显示链接的最后一部分作为标题
            const urlParts = link.split('/');
            let fileName = urlParts[urlParts.length - 1];
            
            // 移除查询参数
            if (fileName.includes('?')) {
                fileName = fileName.split('?')[0];
            }
            
            caption.textContent = fileName;
            
            previewItem.appendChild(img);
            previewItem.appendChild(caption);
            dom.previewContainer.appendChild(previewItem);
        });
    }

    // 生成HTML代码
    dom.generateBtn.addEventListener('click', () => {
        const links = dom.inputLinks.value.trim().split('\n')
            .map(link => link.trim())
            .filter(link => link.length > 0);
            
        if (links.length === 0) {
            showNotification('请先输入图片链接', 'warning');
            return;
        }
        
        // 获取设置
        const format = document.querySelector('input[name="outputFormat"]:checked').value;
        const separator = document.querySelector('input[name="separator"]:checked').value;
        const isResponsive = document.getElementById('responsiveCheck').checked;
        
        // 获取属性
        const classAttr = document.getElementById('classAttr').value.trim();
        const altAttr = document.getElementById('altAttr').value.trim();
        const widthAttr = document.getElementById('widthAttr').value.trim();
        const heightAttr = document.getElementById('heightAttr').value.trim();
        const customAttr = document.getElementById('customAttr').value.trim();
        
        // 构建HTML代码
        let htmlCode = '';
        links.forEach((link, index) => {
            let imgTag = '<img src="' + link + '"';
            
            // 添加类名
            if (classAttr) {
                imgTag += ' class="' + classAttr + (isResponsive ? ' w-full h-auto object-cover' : '') + '"';
            } else if (isResponsive) {
                imgTag += ' class="w-full h-auto object-cover"';
            }
            
            // 添加alt文本
            if (altAttr) {
                const altText = altAttr.replace('{n}', index + 1);
                imgTag += ' alt="' + altText + '"';
            }
            
            // 添加宽度
            if (widthAttr) {
                imgTag += ' width="' + widthAttr + '"';
            }
            
            // 添加高度
            if (heightAttr) {
                imgTag += ' height="' + heightAttr + '"';
            }
            
            // 添加自定义属性
            if (customAttr) {
                imgTag += ' ' + customAttr;
            }
            
            imgTag += '>';
            
            // 根据格式添加分隔符
            if (format === 'multiline' || index === links.length - 1) {
                htmlCode += imgTag;
            } else {
                switch (separator) {
                    case 'newline':
                        htmlCode += imgTag + '\n';
                        break;
                    case 'comma':
                        htmlCode += imgTag + ', ';
                        break;
                    case 'space':
                        htmlCode += imgTag + ' ';
                        break;
                    default:
                        htmlCode += imgTag + '\n';
                }
            }
            
            if (format === 'multiline' && index < links.length - 1) {
                htmlCode += '\n';
            }
        });
        
        dom.outputCode.value = htmlCode;
        showNotification(`已生成 ${links.length} 个图片的HTML代码`, 'success');
        
        // 更新预览
        updatePreview(links);
        
        // 滚动到生成结果区域
        document.getElementById('outputCode').scrollIntoView({ behavior: 'smooth' });
    });

    // 复制到剪贴板
    dom.copyBtn.addEventListener('click', () => {
        if (!dom.outputCode.value) {
            showNotification('没有可复制的内容', 'warning');
            return;
        }
        
        dom.outputCode.select();
        document.execCommand('copy');
        
        // 改变按钮图标表示复制成功
        const originalIcon = dom.copyBtn.innerHTML;
        dom.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        
        showNotification('代码已复制到剪贴板', 'success');
        
        // 恢复原始图标
        setTimeout(() => {
            dom.copyBtn.innerHTML = originalIcon;
        }, 1500);
    });

    // 导出功能
    dom.exportBtn.addEventListener('click', () => {
        if (!dom.outputCode.value) {
            showNotification('没有可导出的内容', 'warning');
            return;
        }
        
        // 显示导出选项模态框
        dom.modalTitle.textContent = '导出选项';
        dom.modalContent.innerHTML = `
            <div class="form-group">
                <label>导出格式</label>
                <div class="radio-group">
                    <label class="radio-label">
                        <input type="radio" name="exportFormat" value="html" checked>
                        <span>HTML文件</span>
                    </label>
                    <label class="radio-label">
                        <input type="radio" name="exportFormat" value="txt">
                        <span>纯文本文件</span>
                    </label>
                </div>
            </div>
            <div class="form-group">
                <label>文件名</label>
                <input type="text" id="exportFileName" value="images.html">
            </div>
        `;
        
        // 显示模态框
        showModal();
        
        // 设置模态框确认按钮事件
        const originalConfirmHandler = dom.modalConfirmBtn.onclick;
        dom.modalConfirmBtn.onclick = function() {
            const format = document.querySelector('input[name="exportFormat"]:checked').value;
            let fileName = document.getElementById('exportFileName').value.trim();
            
            if (!fileName) {
                fileName = format === 'html' ? 'images.html' : 'images.txt';
            }
            
            // 确保文件扩展名正确
            const extension = format === 'html' ? '.html' : '.txt';
            if (!fileName.endsWith(extension)) {
                fileName += extension;
            }
            
            // 创建Blob并下载
            const blob = new Blob([dom.outputCode.value], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            
            // 清理
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification(`已导出为 ${fileName}`, 'success');
            hideModal();
            
            // 恢复原始事件处理
            dom.modalConfirmBtn.onclick = originalConfirmHandler;
        };
    });

    // 导入功能
    dom.importBtn.addEventListener('click', () => {
        dom.fileInput.click();
    });

    dom.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }
        
        if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
            showNotification('请选择TXT文件', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            dom.inputLinks.value = e.target.result;
            showNotification(`已成功导入 ${file.name}`, 'success');
        };
        reader.onerror = function() {
            showNotification('文件读取失败', 'error');
        };
        reader.readAsText(file);
        
        // 重置文件输入，以便可以重复选择同一个文件
        dom.fileInput.value = '';
    });

    // 批量替换功能
    dom.applyReplaceBtn.addEventListener('click', () => {
        const findText = document.getElementById('findText').value.trim();
        const replaceText = document.getElementById('replaceText').value.trim();
        
        if (!findText) {
            showNotification('请输入要查找的文本', 'warning');
            return;
        }
        
        if (!dom.inputLinks.value) {
            showNotification('请先输入图片链接', 'warning');
            return;
        }
        
        const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const newText = dom.inputLinks.value.replace(regex, replaceText);
        
        if (newText !== dom.inputLinks.value) {
            dom.inputLinks.value = newText;
            showNotification('替换完成', 'success');
        } else {
            showNotification('未找到匹配的文本', 'info');
        }
    });

    // 检查无效链接
    dom.checkLinksBtn.addEventListener('click', () => {
        const links = dom.inputLinks.value.trim().split('\n')
            .map(link => link.trim())
            .filter(link => link.length > 0);
            
        if (links.length === 0) {
            showNotification('请先输入图片链接', 'warning');
            return;
        }
        
        showNotification('开始检查链接有效性，请稍候...', 'info');
        
        let validCount = 0;
        let invalidCount = 0;
        const invalidLinks = [];
        
        links.forEach((link, index) => {
            const img = new Image();
            img.src = link;
            
            img.onload = function() {
                validCount++;
                checkComplete();
            };
            
            img.onerror = function() {
                invalidCount++;
                invalidLinks.push(link);
                checkComplete();
            };
            
            // 设置超时时间为5秒
            setTimeout(() => {
                if (!img.complete) {
                    invalidCount++;
                    invalidLinks.push(link);
                    checkComplete();
                }
            }, 5000);
        });
        
        function checkComplete() {
            if (validCount + invalidCount === links.length) {
                // 显示检查结果
                dom.modalTitle.textContent = '链接检查结果';
                dom.modalContent.innerHTML = `
                    <div style="margin-bottom: 1rem;">
                        <p><strong>总链接数:</strong> ${links.length}</p>
                        <p><strong>有效链接:</strong> <span style="color: #22c55e;">${validCount}</span></p>
                        <p><strong>无效链接:</strong> <span style="color: #ef4444;">${invalidCount}</span></p>
                    </div>
                    ${invalidCount > 0 ? `
                        <div style="margin-top: 1rem;">
                            <h4 style="margin-bottom: 0.5rem;">无效链接列表:</h4>
                            <textarea readonly style="min-height: 150px; font-family: monospace; font-size: 0.85rem;">${invalidLinks.join('\n')}</textarea>
                        </div>
                    ` : ''}
                `;
                
                showModal();
            }
        }
    });

    // 切换预览视图
    dom.togglePreviewBtn.addEventListener('click', () => {
        if (previewMode === 'grid') {
            previewMode = 'list';
            dom.previewContainer.style.gridTemplateColumns = '1fr';
            dom.togglePreviewBtn.innerHTML = '<i class="fas fa-th-large"></i>网格视图';
        } else {
            previewMode = 'grid';
            dom.previewContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
            dom.togglePreviewBtn.innerHTML = '<i class="fas fa-list"></i>列表视图';
        }
    });

    // 模态框功能
    function showModal() {
        dom.modal.classList.add('show');
        // 防止背景滚动
        document.body.style.overflow = 'hidden';
    }

    function hideModal() {
        dom.modal.classList.remove('show');
        // 恢复背景滚动
        document.body.style.overflow = '';
    }

    // 关闭模态框事件
    dom.closeModal.addEventListener('click', hideModal);
    dom.modalCancelBtn.addEventListener('click', hideModal);

    // 点击模态框外部关闭
    dom.modal.addEventListener('click', (e) => {
        if (e.target === dom.modal) {
            hideModal();
        }
    });

    // 键盘事件处理
    document.addEventListener('keydown', (e) => {
        // Ctrl+Enter 生成代码
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            dom.generateBtn.click();
        }
        
        // Ctrl+C 复制代码
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && 
            document.activeElement !== dom.inputLinks && 
            document.activeElement !== document.getElementById('outputCode')) {
            e.preventDefault();
            dom.copyBtn.click();
        }
        
        // Esc 关闭模态框
        if (e.key === 'Escape' && dom.modal.classList.contains('show')) {
            hideModal();
        }
        
        // Alt+数字键 切换标签页
        if (e.altKey && !e.ctrlKey && !e.shiftKey) {
            const num = parseInt(e.key);
            if (num >= 1 && num <= 3) {
                // 主标签栏切换
                e.preventDefault();
                const mainTabs = document.querySelectorAll('.tabs:first-child .tab');
                if (mainTabs[num - 1]) {
                    mainTabs[num - 1].click();
                }
            }
            else if (num === 4 || num === 5) {
                // 结果和预览标签栏切换
                e.preventDefault();
                const resultTabs = document.querySelectorAll('.tabs:last-child .tab');
                const tabIndex = num === 4 ? 0 : 1; // Alt+4切换到结果，Alt+5切换到预览
                if (resultTabs[tabIndex]) {
                    resultTabs[tabIndex].click();
                }
            }
        }
    });

    // 初始化提示
    setTimeout(() => {
        showNotification('欢迎使用批量图片外链转HTML工具', 'info');
        
        // 显示快捷键提示
        setTimeout(() => {
            showNotification('提示：使用 Alt+1 到 Alt+3 快速切换主标签页', 'info');
        }, 2000);
        
        setTimeout(() => {
            showNotification('提示：使用 Alt+4 和 Alt+5 快速切换结果和预览标签页', 'info');
        }, 4000);
    }, 500);
});