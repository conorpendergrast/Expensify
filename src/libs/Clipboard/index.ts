// on Web/desktop this import will be replaced with `react-native-web`
import {Clipboard as RNWClipboard} from 'react-native-web';
import CONST from '../../CONST';
import * as Browser from '../Browser';
import {SetString, Clipboard} from './types';
import Nullable from '../../types/utils/Nullable';

type ComposerSelection = {
    start: number;
    end: number;
    direction: 'forward' | 'backward' | 'none';
};

type AnchorSelection = {
    anchorOffset: number;
    focusOffset: number;
    anchorNode: Node;
    focusNode: Node;
};

type OriginalSelection = ComposerSelection | Partial<Nullable<AnchorSelection>>;

const canSetHtml =
    () =>
    (...args: ClipboardItems) =>
        navigator?.clipboard?.write([...args]);

/**
 * Deprecated method to write the content as HTML to clipboard.
 */
function setHTMLSync(html: string, text: string) {
    const node = document.createElement('span');
    node.textContent = html;
    node.style.all = 'unset';
    node.style.opacity = '0';
    node.style.position = 'absolute';
    node.style.whiteSpace = 'pre-wrap';
    node.style.userSelect = 'text';
    node.addEventListener('copy', (e) => {
        e.stopPropagation();
        e.preventDefault();
        e.clipboardData?.clearData();
        e.clipboardData?.setData('text/html', html);
        e.clipboardData?.setData('text/plain', text);
    });
    document.body.appendChild(node);

    const selection = window?.getSelection();
    const firstAnchorChild = selection?.anchorNode?.firstChild;
    const isComposer = firstAnchorChild instanceof HTMLTextAreaElement;
    let originalSelection: OriginalSelection | null = null;
    if (isComposer) {
        originalSelection = {
            start: firstAnchorChild.selectionStart,
            end: firstAnchorChild.selectionEnd,
            direction: firstAnchorChild.selectionDirection,
        };
    } else {
        originalSelection = {
            anchorNode: selection?.anchorNode,
            anchorOffset: selection?.anchorOffset,
            focusNode: selection?.focusNode,
            focusOffset: selection?.focusOffset,
        };
    }

    selection?.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(node);
    selection?.addRange(range);

    try {
        document.execCommand('copy');
    } catch (e) {
        // The 'copy' command can throw a SecurityError exception, we ignore this exception on purpose.
        // See https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#the-copy-command for more details.
    }

    selection?.removeAllRanges();

    if (isComposer && 'start' in originalSelection) {
        firstAnchorChild.setSelectionRange(originalSelection.start, originalSelection.end, originalSelection.direction);
    } else {
        const anchorSelection = originalSelection as AnchorSelection;
        selection?.setBaseAndExtent(anchorSelection.anchorNode, anchorSelection.anchorOffset, anchorSelection.focusNode, anchorSelection.focusOffset);
    }

    document.body.removeChild(node);
}

/**
 * Writes the content as HTML if the web client supports it.
 */
const setHtml = (html: string, text: string) => {
    if (!html || !text) {
        return;
    }

    if (!canSetHtml()) {
        throw new Error('clipboard.write is not supported on this platform, thus HTML cannot be copied.');
    }

    if (CONST.BROWSER.SAFARI === Browser.getBrowser()) {
        // Safari sanitize "text/html" data before writing to the pasteboard when using Clipboard API,
        // whitespaces in the start of line are stripped away. We use the deprecated method to copy
        // contents as HTML and keep whitespaces in the start of line on Safari.
        // See https://webkit.org/blog/10855/async-clipboard-api/ for more details.
        setHTMLSync(html, text);
    } else {
        navigator.clipboard.write([
            new ClipboardItem({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'text/html': new Blob([html], {type: 'text/html'}),
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'text/plain': new Blob([text], {type: 'text/plain'}),
            }),
        ]);
    }
};

/**
 * Sets a string on the Clipboard object via react-native-web
 */
const setString: SetString = (text) => {
    RNWClipboard.setString(text);
};

const clipboard: Clipboard = {
    setString,
    canSetHtml,
    setHtml,
};

export default clipboard;
