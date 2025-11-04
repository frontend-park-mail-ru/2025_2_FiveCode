import { Block, renderBlock, CodeBlock } from '../components/block';
import { createImageModal } from '../components/imageModal';

interface EditorManagerConfig {
  container: HTMLElement;
  toolbar: HTMLElement;
  addBlockMenu: HTMLElement;
  initialBlocks: Block[];
}

export interface EditorManager {
  render: () => void;
  getBlocks: () => Block[];
  focusBlock: (blockId: string | number) => void;
}

export function createEditorManager({ container, toolbar, addBlockMenu, initialBlocks }: EditorManagerConfig): EditorManager {
  let blocks: Block[] = [...initialBlocks];
  const mainContainer = container.closest<HTMLElement>('.note-editor__main');

  const updateBlockContent = (id: string | number, newContent: string) => {
    const block = blocks.find(b => b.id.toString() === id.toString());
    if (block) {
      block.content = newContent;
    }
  };

  const addNewBlock = async (currentBlockId: string | number, type: Block['type']) => {
    let newBlock: Block | null = null;
    const baseBlock = { id: `local-${Date.now()}`, type, content: '' };

    switch(type) {
      case 'code':
        const codeData = { language: 'javascript', content: '' };
        newBlock = { ...baseBlock, id: baseBlock.id, content: JSON.stringify(codeData) };
        break;
      case 'image':
        const url = await createImageModal();
        if (url) {
          newBlock = { ...baseBlock, id: baseBlock.id, content: url };
        }
        break;
      case 'text':
      default:
        newBlock = { ...baseBlock, id: baseBlock.id };
        break;
    }
    
    if (newBlock) {
      const currentIndex = blocks.findIndex(b => b.id.toString() === currentBlockId.toString());
      if (currentIndex > -1) {
        blocks.splice(currentIndex + 1, 0, newBlock);
        render();
        focusBlock(newBlock.id);
      }
    }
  };

  const render = () => {
    const activeElement = document.activeElement;
    const activeBlockId = activeElement ? activeElement.closest<HTMLElement>('.block-container')?.dataset.blockId : undefined;
    
    container.innerHTML = '';
    blocks.forEach(block => {
      const blockElement = renderBlock(block, updateBlockContent);
      container.appendChild(blockElement);
    });

    if (activeBlockId) {
      focusBlock(activeBlockId);
    }
  };

  const focusBlock = (blockId: string | number) => {
    const blockToFocus = container.querySelector(`[data-block-id="${blockId}"] .block`);
    if (blockToFocus) {
      (blockToFocus as HTMLElement).focus();
    }
  };

  const applyInlineStyle = (styleProperty: string, styleValue: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const parentBlock = (range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer.parentElement : range.startContainer as HTMLElement)?.closest('.block--text');
    if (!parentBlock) return;

    const span = document.createElement('span');
    span.style.setProperty(styleProperty, styleValue);

    try {
        const selectedContent = range.extractContents();
        span.appendChild(selectedContent);
        range.insertNode(span);
    } catch (e) {
        console.error("Could not apply style:", e);
        return;
    }
    
    selection.removeAllRanges();

    const blockId = parentBlock.closest<HTMLElement>('.block-container')?.dataset.blockId;
    if (blockId) {
        updateBlockContent(blockId, parentBlock.innerHTML);
    }
  };

  const splitBlockAndInsertCode = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    if (!selectedText) return;

    const startContainer = range.startContainer;
    const parentBlockElement = (startContainer.nodeType === Node.TEXT_NODE ? startContainer.parentElement : startContainer as HTMLElement)?.closest<HTMLElement>('.block');
    const parentContainerElement = parentBlockElement?.parentElement;

    if (!parentBlockElement || !parentContainerElement || !parentContainerElement.dataset.blockId) return;

    const originalBlockId = parentContainerElement.dataset.blockId;
    let originalBlockIndex = blocks.findIndex(b => b.id.toString() === originalBlockId);
    const originalBlock = blocks[originalBlockIndex];
    if (originalBlockIndex === -1 || !originalBlock) return;

    const tempWrapper = document.createElement('span');
    range.surroundContents(tempWrapper);
    
    const fullHtml = parentBlockElement.innerHTML;
    const parts = fullHtml.split(tempWrapper.outerHTML);
    
    const beforeContent = parts[0];
    const afterContent = parts[1];
    
    const codeData = { language: 'text', content: selectedText };
    const newCodeBlock: Block = {
      id: `local-${Date.now()}`,
      type: 'code',
      content: JSON.stringify(codeData)
    };
    const newBlocks: Block[] = [];

    if (beforeContent) {
      const beforeBlock: Block = { ...originalBlock, id: originalBlock.id, content: beforeContent, type: 'text' };
      newBlocks.push(beforeBlock);
    } else {
        blocks.splice(originalBlockIndex, 1);
        originalBlockIndex--;
    }
    
    newBlocks.push(newCodeBlock);

    if (afterContent) {
      newBlocks.push({
        id: `local-${Date.now() + 1}`,
        type: 'text',
        content: afterContent
      });
    }

    if (beforeContent) {
        blocks.splice(originalBlockIndex, 1, ...newBlocks);
    } else {
        blocks.splice(originalBlockIndex + 1, 0, ...newBlocks);
    }
    
    render();
    focusBlock(newCodeBlock.id);
  };

  const setupEventListeners = () => {
    if (!mainContainer) return;

    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        toolbar?.classList.remove('visible');
        return;
      }
      const targetNode = selection.anchorNode;
      if (!targetNode || !(targetNode instanceof Node)) {
          toolbar?.classList.remove('visible');
          return;
      }
      const parentBlock = (targetNode.nodeType === Node.TEXT_NODE ? targetNode.parentElement : targetNode as HTMLElement)?.closest('.block--text');
      if (parentBlock && container.contains(parentBlock)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const mainRect = mainContainer.getBoundingClientRect();

        if (toolbar) {
            toolbar.style.top = `${rect.top - mainRect.top + mainContainer.scrollTop - toolbar.offsetHeight - 5}px`;
            toolbar.style.left = `${rect.left - mainRect.left + rect.width / 2 - toolbar.offsetWidth / 2}px`;
            toolbar.classList.add('visible');
        }
      } else {
        toolbar?.classList.remove('visible');
      }
    });

    container.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        if (target.closest('.block--code')) return;
        e.preventDefault();
        const targetBlockContainer = target.closest<HTMLElement>('.block-container');
        if (targetBlockContainer?.dataset.blockId) {
          addNewBlock(targetBlockContainer.dataset.blockId, 'text');
        }
      }
    });

    container.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const handle = target.closest<HTMLElement>('.block-handle');
      if (handle) {
        const parentContainer = handle.closest<HTMLElement>('.block-container');
        if (parentContainer && addBlockMenu) {
          addBlockMenu.style.top = `${parentContainer.offsetTop + handle.offsetTop + handle.offsetHeight}px`;
          addBlockMenu.style.left = `${parentContainer.offsetLeft + handle.offsetLeft}px`;
          addBlockMenu.classList.add('visible');
          addBlockMenu.dataset.currentBlockId = parentContainer.dataset.blockId;
        }
      }
    });

    if (addBlockMenu) {
      addBlockMenu.addEventListener('click', async (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const item = target.closest<HTMLElement>('.menu-item');
        const type = item?.dataset.type as Block['type'];
        const currentBlockId = addBlockMenu.dataset.currentBlockId;
        
        addBlockMenu.classList.remove('visible');
        if (type && currentBlockId) {
          await addNewBlock(currentBlockId, type);
        }
      });
    }

    if (toolbar) {
      const fontDropdown = toolbar.querySelector<HTMLElement>('#font-dropdown');
      
      if (fontDropdown) {
          const fontNameDisplay = fontDropdown.querySelector<HTMLElement>('#current-font-name');
          const dropdownMenu = fontDropdown.querySelector<HTMLElement>('.dropdown-menu');

          fontDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            fontDropdown.classList.toggle('active');
          });

          dropdownMenu?.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const item = target.closest<HTMLElement>('.dropdown-item');
            if (item && item.dataset.value && fontNameDisplay) {
                applyInlineStyle('font-family', item.dataset.value);
                fontNameDisplay.textContent = item.textContent || 'Sans-Serif';
            }
          });
      }

      document.addEventListener('click', (e) => {
        if (fontDropdown && !fontDropdown.contains(e.target as Node)) {
            fontDropdown.classList.remove('active');
        }
        if (addBlockMenu && !addBlockMenu.contains(e.target as Node) && !(e.target as HTMLElement).closest('.block-handle')) {
            addBlockMenu.classList.remove('visible');
        }
      });

      toolbar.addEventListener('mousedown', (e) => {
        e.preventDefault();
      });

      toolbar.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const commandElement = target.closest('button[data-command]');
        if (!commandElement) return;

        const command = commandElement.getAttribute('data-command')!;
        
        if (command === 'convertToCode') {
          splitBlockAndInsertCode();
          return;
        }

        const value = commandElement.getAttribute('data-value') || undefined;
        document.execCommand(command, false, value);
      });
    }
  };

  setupEventListeners();

  return {
    render,
    getBlocks: () => blocks,
    focusBlock,
  };
}