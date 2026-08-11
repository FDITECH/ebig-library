import { CSSProperties, forwardRef, MutableRefObject, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
    ClassicEditor,
    Alignment,
    Autoformat,
    AutoImage,
    AutoLink,
    Autosave,
    BalloonToolbar,
    BlockQuote,
    Bold,
    Bookmark,
    Code,
    CodeBlock,
    Essentials,
    FindAndReplace,
    FontBackgroundColor,
    FontColor,
    FontFamily,
    FontSize,
    FullPage,
    GeneralHtmlSupport,
    Heading,
    Highlight,
    HorizontalLine,
    HtmlComment,
    HtmlEmbed,
    ImageBlock,
    ImageCaption,
    ImageInline,
    ImageInsert,
    ImageInsertViaUrl,
    ImageResize,
    ImageStyle,
    ImageTextAlternative,
    ImageToolbar,
    ImageUpload,
    Indent,
    IndentBlock,
    Italic,
    Link,
    LinkImage,
    List,
    ListProperties,
    // Markdown,
    MediaEmbed,
    Mention,
    PageBreak,
    Paragraph,
    PasteFromMarkdownExperimental,
    PasteFromOffice,
    PictureEditing,
    RemoveFormat,
    ShowBlocks,
    SourceEditing,
    SpecialCharacters,
    SpecialCharactersArrows,
    SpecialCharactersCurrency,
    SpecialCharactersEssentials,
    SpecialCharactersLatin,
    SpecialCharactersMathematical,
    SpecialCharactersText,
    Strikethrough,
    Style,
    Subscript,
    Superscript,
    Table,
    TableCaption,
    TableCellProperties,
    TableColumnResize,
    TableProperties,
    TableToolbar,
    TextPartLanguage,
    TextTransformation,
    // Title,
    TodoList,
    Underline,
    WordCount,
    EventInfo,
    Fullscreen,
    IconExportPdf,
    ButtonView,
    Plugin,
    Command,
    WidgetToolbarRepository,
    isWidget
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
// @ts-ignore
import translations from 'ckeditor5/translations/vi';
import './ck-editor.css';
import { useTranslation } from 'react-i18next';

/**
 * Create a free account with a trial: https://portal.ckeditor.com/checkout?plan=free
 */
const LICENSE_KEY = 'GPL'; // or <YOUR_LICENSE_KEY>.

/**
 * Please update the following values with your tokens.
 * Instructions on how to obtain them: https://ckeditor.com/docs/trial/latest/guides/real-time/quick-start.html
 */

// wordCount = editor.plugins.get('WordCount');
interface Props {
    id?: string,
    style?: CSSProperties,
    className?: string,
    value?: string,
    placeholder?: string,
    disabled?: boolean,
    menuBar?: boolean,
    onChange?: (event: EventInfo, editor: ClassicEditor) => void,
    onFocus?: (event: EventInfo, editor: ClassicEditor) => void,
    onBlur?: (event: EventInfo, editor: ClassicEditor) => void,
    onError?: (error: Error, details: any) => void,
    onReady?: (editor: ClassicEditor) => void,
    onAfterDestroy?: (editor: ClassicEditor) => void,
    extraPlugins?: Array<any>,
    helperText?: string,
    helperTextColor?: string,
    customConfig?: {
        toolbar: { item?: Array<string>, shouldNotGroupWhenFull?: boolean, [p: string]: any },
        balloonToolbar?: Array<string>,
        mediaEmbed?: { previewsInData?: boolean, providers?: Array<{ [p: string]: any }>, [p: string]: any },
        fontFamily?: { options?: Array<string>, supportAllValues?: boolean },
        fontSize?: { options?: Array<string>, supportAllValues?: boolean },
        fontColor?: { columns?: number, colors?: Array<{ color: string, label: string }> },
        fontBackgroundColor?: { columns?: number, colors?: Array<{ color: string, label: string }> },
        [p: string]: any
    },
    handleExportPdf?: (editor: ClassicEditor) => void,
}

type PageSize = 'A4' | 'A3';
type PageOrientation = 'portrait' | 'landscape';
interface PageConfig { size: PageSize; orientation: PageOrientation; }

const PAGE_DIMENSIONS: Record<PageSize, Record<PageOrientation, { width: number; height: number; widthMm: number; heightMm: number }>> = {
    A4: {
        portrait: { width: 794, height: 1123, widthMm: 210, heightMm: 297 },
        landscape: { width: 1123, height: 794, widthMm: 297, heightMm: 210 },
    },
    A3: {
        portrait: { width: 1123, height: 1587, widthMm: 297, heightMm: 420 },
        landscape: { width: 1587, height: 1123, widthMm: 420, heightMm: 297 },
    },
};

function applyPageDimensions(editor: any, config: PageConfig) {
    const { width, height } = PAGE_DIMENSIONS[config.size][config.orientation];
    const domRoot = (editor as any).editing.view.getDomRoot() as HTMLElement | undefined;
    if (!domRoot) return;
    domRoot.style.width = `${width}px`;
    domRoot.style.minHeight = `${height}px`;
    domRoot.style.margin = '0 auto';
    domRoot.style.position = 'relative';
    domRoot.style.boxSizing = 'border-box';
}

class ExportPdfCommand extends Command {
    private _pageConfigRef: MutableRefObject<PageConfig>;

    constructor(editor: any, pageConfigRef: MutableRefObject<PageConfig>) {
        super(editor);
        this._pageConfigRef = pageConfigRef;
    }

    execute() {
        const editor = this.editor;
        const content = editor.getData();
        const { size, orientation } = this._pageConfigRef.current;
        const { widthMm, heightMm } = PAGE_DIMENSIONS[size][orientation];
        const printSize = `${size}${orientation === 'landscape' ? ' landscape' : ''}`;

        const printWindow = window.open("", "_blank", "width=800,height=900");
        if (!printWindow) return;

        printWindow.document.open();
        printWindow.document.write(`
            <html>
            <head>
                <title>Export PDF</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        font-size: 14px;
                    }

                    figure.table {
                        width: 100%;
                        display: table;
                        margin: 0.9em auto;
                        overflow: hidden;
                    }

                    figure.table table {
                        width: 100%;
                        height: 100%;
                        border-collapse: collapse;
                        border-spacing: 0;
                        border: 1px double hsl(0, 0%, 70%);
                    }

                    figure.table table>thead>tr>th,
                    figure.table table>tbody>tr>td {
                        min-width: 2em;
                        padding: 0.4em;
                        border: 1px solid hsl(0, 0%, 75%);
                    }

                    figure.table table>thead>tr>th {
                        font-weight: 700;
                        background: #0000000d;
                    }

                    ruby {
                        display: ruby !important;
                        ruby-position: over !important;
                    }

                    rt {
                        display: ruby-text !important;
                        ruby-position: over !important;
                        font-size: 0.5em !important;
                        line-height: 1 !important;
                    }

                    rp { display: none !important; }

                    span:has(>ruby) {
                        display: ruby !important;
                        ruby-position: over !important;
                    }

                    .page-content {
                        width: ${widthMm}mm;
                        min-height: ${heightMm}mm;
                        padding: 20mm;
                        box-sizing: border-box;
                        position: relative;
                    }

                    img { max-width: 100%; height: auto; }

                    @page { size: ${printSize}; margin: 15mm; }
                </style>
            </head>
            <body>
                <div class="page-content">
                    ${content}
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();

        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
        };
    }

    refresh() {
        this.isEnabled = true;
    }
}

// 2. Media Properties Plugin factory — uses i18n for labels
function createMediaPropertiesPlugin(t: (key: string) => string) {
    return class MediaPropertiesPlugin extends Plugin {
        static get pluginName() {
            return 'MediaProperties' as const;
        }

        static get requires() {
            return [WidgetToolbarRepository] as const;
        }

        init() {
            const editor = this.editor;

            const buttons: Array<{ name: string; labelKey: string; param: string }> = [
                { name: 'mediaAutoplay', labelKey: 'autoplay', param: 'autoplay' },
                { name: 'mediaLoop', labelKey: 'loop', param: 'loop' },
                { name: 'mediaMuted', labelKey: 'muted', param: 'mute' },
            ];

            for (const btn of buttons) {
                editor.ui.componentFactory.add(btn.name, (locale) => {
                    const view = new ButtonView(locale);
                    view.set({
                        label: t(btn.labelKey),
                        withText: true,
                        tooltip: true,
                        isToggleable: true,
                    });

                    view.on('execute', () => {
                        const root = editor.editing.view.document.getRoot();
                        if (!root) return;

                        editor.model.change((writer: any) => {
                            const selection = editor.model.document.selection;
                            const selectedElement = selection.getSelectedElement();
                            if (!selectedElement || selectedElement.name !== 'media') return;

                            const currentUrl: string = selectedElement.getAttribute('url') as string || '';
                            const separator = currentUrl.includes('?') ? '&' : '?';

                            if (currentUrl.includes(`${btn.param}=1`)) {
                                const newUrl = currentUrl
                                    .replace(new RegExp(`[?&]${btn.param}=1`), '')
                                    .replace(/[?&]$/, '')
                                    .replace(/\?&/, '?');
                                writer.setAttribute('url', newUrl, selectedElement);
                                view.set({ isOn: false });
                            } else {
                                writer.setAttribute('url', `${currentUrl}${separator}${btn.param}=1`, selectedElement);
                                view.set({ isOn: true });
                            }
                        });
                    });

                    const updateState = () => {
                        const selectedElement = editor.model.document.selection.getSelectedElement();
                        if (selectedElement && selectedElement.name === 'media') {
                            const url: string = selectedElement.getAttribute('url') as string || '';
                            view.set({ isOn: url.includes(`${btn.param}=1`) });
                        } else {
                            view.set({ isOn: false });
                        }
                    };

                    editor.model.document.selection.on('change:range', updateState);
                    editor.model.document.on('change:data', updateState);

                    // Set initial state from current selection
                    updateState();

                    return view;
                });
            }
        }

        afterInit() {
            const editor = this.editor;
            const widgetToolbarRepository = editor.plugins.get(WidgetToolbarRepository);

            widgetToolbarRepository.register('media', {
                ariaLabel: 'Media toolbar',
                items: ['mediaAutoplay', 'mediaLoop', 'mediaMuted'],
                getRelatedElement: (selection) => {
                    const viewElement = selection.getSelectedElement();
                    if (viewElement && isWidget(viewElement)) {
                        const modelElement = editor.editing.mapper.toModelElement(viewElement);
                        if (modelElement && modelElement.name === 'media') {
                            return viewElement;
                        }
                    }
                    return null;
                }
            });
        }
    };
}

class RubySupport extends Plugin {
    static get requires() {
        return [GeneralHtmlSupport];
    }

    static get pluginName() {
        return 'RubySupport' as const;
    }

    init() {
        const dataFilter = this.editor.plugins.get('DataFilter');
        const dataSchema = this.editor.plugins.get('DataSchema');

        // Register rt and rp FIRST (ruby depends on them)
        dataSchema.registerInlineElement({
            view: 'rt',
            model: 'htmlRt',
        });

        dataSchema.registerInlineElement({
            view: 'rp',
            model: 'htmlRp',
        });

        // Register ruby — modelSchema handles its own structure
        dataSchema.registerInlineElement({
            view: 'ruby',
            model: 'htmlRuby',
        });

        // Allow elements
        dataFilter.allowElement('ruby');
        dataFilter.allowElement('rt');
        dataFilter.allowElement('rp');

        // Allow all attributes/styles
        const allAttrs: any = { attributes: true, classes: true, styles: true };
        dataFilter.allowAttributes({ name: 'ruby', ...allAttrs });
        dataFilter.allowAttributes({ name: 'rt', ...allAttrs });
        dataFilter.allowAttributes({ name: 'rp', ...allAttrs });

        // After GHS registers the model nodes, extend nesting rules
        // Uses afterInit to ensure GHS has already set up the model
        this.editor.plugins.get('GeneralHtmlSupport');
    }

    afterInit() {
        const schema = this.editor.model.schema;

        // Extend ruby to allow rt, rp, span, and text inside it
        if (schema.isRegistered('htmlRuby')) {
            schema.extend('htmlRuby', {
                allowChildren: ['htmlRt', 'htmlRp', '$text'],
            });
        }

        // Allow htmlSpan (from GHS) inside htmlRuby
        if (schema.isRegistered('htmlSpan')) {
            schema.extend('htmlSpan', {
                allowIn: ['htmlRuby'],
            });
        }

        // Allow rt/rp inside ruby
        if (schema.isRegistered('htmlRt')) {
            schema.extend('htmlRt', {
                allowIn: ['htmlRuby'],
            });
        }

        if (schema.isRegistered('htmlRp')) {
            schema.extend('htmlRp', {
                allowIn: ['htmlRuby'],
            });
        }
    }
}

function createExportPdfPlugin(pageConfigRef: MutableRefObject<PageConfig>) {
    return class ExportPdfPlugin extends Plugin {
        static get pluginName() { return 'ExportPdf' as const; }

        init() {
            const editor = this.editor;
            editor.commands.add('exportPdf', new ExportPdfCommand(editor, pageConfigRef));
            editor.ui.componentFactory.add('exportPdf', (locale) => {
                const view = new ButtonView(locale);
                view.set({ label: 'Export PDF', icon: IconExportPdf, tooltip: true });
                view.on('execute', () => { editor.execute('exportPdf'); });
                return view;
            });
        }
    };
}

function createPageSetupPlugin(
    t: (key: string) => string,
    pageConfigRef: MutableRefObject<PageConfig>,
    setPageConfig: (cfg: PageConfig) => void
) {
    let a4Btn: ButtonView | null = null;
    let a3Btn: ButtonView | null = null;
    let orientBtn: ButtonView | null = null;

    const updateButtons = (cfg: PageConfig) => {
        if (a4Btn) a4Btn.set({ isOn: cfg.size === 'A4' });
        if (a3Btn) a3Btn.set({ isOn: cfg.size === 'A3' });
        if (orientBtn) orientBtn.set({
            isOn: cfg.orientation === 'landscape',
            label: cfg.orientation === 'landscape' ? `⇕ ${t('portrait')}` : `⇔ ${t('landscape')}`,
        });
    };

    return class PageSetupPlugin extends Plugin {
        static get pluginName() { return 'PageSetup' as const; }

        init() {
            const editor = this.editor;

            editor.ui.componentFactory.add('pageA4', (locale) => {
                a4Btn = new ButtonView(locale);
                a4Btn.set({ label: 'A4', withText: true, tooltip: 'A4', isToggleable: true, isOn: pageConfigRef.current.size === 'A4' });
                a4Btn.on('execute', () => {
                    const cfg: PageConfig = { ...pageConfigRef.current, size: 'A4' };
                    pageConfigRef.current = cfg;
                    setPageConfig(cfg);
                    applyPageDimensions(editor, cfg);
                    updateButtons(cfg);
                });
                return a4Btn;
            });

            editor.ui.componentFactory.add('pageA3', (locale) => {
                a3Btn = new ButtonView(locale);
                a3Btn.set({ label: 'A3', withText: true, tooltip: 'A3', isToggleable: true, isOn: pageConfigRef.current.size === 'A3' });
                a3Btn.on('execute', () => {
                    const cfg: PageConfig = { ...pageConfigRef.current, size: 'A3' };
                    pageConfigRef.current = cfg;
                    setPageConfig(cfg);
                    applyPageDimensions(editor, cfg);
                    updateButtons(cfg);
                });
                return a3Btn;
            });

            editor.ui.componentFactory.add('pageOrientation', (locale) => {
                orientBtn = new ButtonView(locale);
                const isLandscape = pageConfigRef.current.orientation === 'landscape';
                orientBtn.set({
                    label: isLandscape ? `⇕ ${t('portrait')}` : `⇔ ${t('landscape')}`,
                    withText: true,
                    tooltip: true,
                    isToggleable: true,
                    isOn: isLandscape,
                });
                orientBtn.on('execute', () => {
                    const newOrientation: PageOrientation = pageConfigRef.current.orientation === 'portrait' ? 'landscape' : 'portrait';
                    const cfg: PageConfig = { ...pageConfigRef.current, orientation: newOrientation };
                    pageConfigRef.current = cfg;
                    setPageConfig(cfg);
                    applyPageDimensions(editor, cfg);
                    updateButtons(cfg);
                });
                return orientBtn;
            });
        }
    };
}

function createFreePositionPlugin(t: (key: string) => string) {
    return class FreePositionPlugin extends Plugin {
        static get pluginName() { return 'FreePosition' as const; }

        init() {
            const editor = this.editor;

            editor.ui.componentFactory.add('insertFreeBlock', (locale) => {
                const btn = new ButtonView(locale);
                btn.set({ label: t('freeBlock') || 'Free Block', withText: true, tooltip: true });
                btn.on('execute', () => {
                    const html = `<div data-free-position="true" style="position:absolute;left:20px;top:20px;width:200px;min-height:40px;padding:8px;border:1px dashed #287CF0;">Text</div>`;
                    const viewFragment = editor.data.processor.toView(html);
                    const modelFragment = editor.data.toModel(viewFragment, '$root');
                    editor.model.change(() => { editor.model.insertContent(modelFragment); });
                });
                return btn;
            });
        }

        afterInit() {
            const editor = this.editor;
            let dragging = false;
            let dragEl: HTMLElement | null = null;
            let startX = 0, startY = 0, startLeft = 0, startTop = 0;

            const domRoot = (editor as any).editing.view.getDomRoot() as HTMLElement | null;
            if (!domRoot) return;

            domRoot.addEventListener('mousedown', (e: MouseEvent) => {
                const block = (e.target as HTMLElement).closest('[data-free-position="true"]') as HTMLElement | null;
                if (!block) return;
                e.preventDefault();
                e.stopPropagation();
                dragging = true;
                dragEl = block;
                block.classList.add('free-position-block--dragging');
                startX = e.clientX;
                startY = e.clientY;
                startLeft = parseInt(block.style.left || '0', 10);
                startTop = parseInt(block.style.top || '0', 10);
            }, true);

            const onMouseMove = (e: MouseEvent) => {
                if (!dragging || !dragEl) return;
                dragEl.style.left = `${Math.max(0, startLeft + (e.clientX - startX))}px`;
                dragEl.style.top = `${Math.max(0, startTop + (e.clientY - startY))}px`;
            };

            const onMouseUp = () => {
                if (!dragging || !dragEl) return;
                dragging = false;
                dragEl.classList.remove('free-position-block--dragging');
                const left = dragEl.style.left;
                const top = dragEl.style.top;
                const targetEl = dragEl;
                dragEl = null;

                const viewEl = (editor as any).editing.view.domConverter.domToView(targetEl);
                if (viewEl) {
                    const modelEl = (editor as any).editing.mapper.toModelElement(viewEl);
                    if (modelEl) {
                        editor.model.change((writer: any) => {
                            const attrs: any = modelEl.getAttribute('htmlAttributes') || {};
                            writer.setAttribute('htmlAttributes', {
                                ...attrs,
                                styles: { ...(attrs.styles || {}), left, top },
                            }, modelEl);
                        });
                    }
                }
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);

            this.listenTo(editor, 'destroy', () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            });
        }
    };
}

interface CustomRef {
    element: HTMLDivElement | null;
    editor: ClassicEditor | null;
}

export const CustomCkEditor5 = forwardRef<CustomRef, Props>(({ style = { width: "100%", height: 400, maxHeight: 600, borderRadius: 8 }, extraPlugins = [], ...props }, ref) => {
    const editorContainerRef = useRef<HTMLDivElement | null>(null);
    const editorRef = useRef<ClassicEditor | null>(null);
    const { t, i18n } = useTranslation();
    const [pageConfig, setPageConfig] = useState<PageConfig>({ size: 'A4', orientation: 'portrait' });
    const pageConfigRef = useRef<PageConfig>(pageConfig);
    pageConfigRef.current = pageConfig;

    useEffect(() => {
        if (editorRef.current) applyPageDimensions(editorRef.current, pageConfig);
    }, [pageConfig]);

    const editorConfig: any = useMemo(() => ({
        toolbar: {
            items: [
                'exportPdf',
                'fullscreen',
                'pageA4',
                'pageA3',
                'pageOrientation',
                'insertFreeBlock',
                '|',
                'heading',
                '|',
                // 'sourceEditing',
                // 'showBlocks',
                // 'findAndReplace',
                // 'textPartLanguage',
                'fontSize',
                'fontFamily',
                'fontColor',
                'fontBackgroundColor',
                '|',
                'bold',
                'italic',
                'underline',
                'strikethrough',
                // 'subscript',
                // 'superscript',
                // 'code',
                // 'removeFormat',
                '|',
                'insertImage',
                'specialCharacters',
                'horizontalLine',
                'pageBreak',
                'link',
                // 'bookmark',
                // 'insertImageViaUrl',
                // 'ckbox',
                'mediaEmbed',
                'insertTable',
                'highlight',
                // 'blockQuote',
                // 'codeBlock',
                'htmlEmbed',
                '|',
                'alignment',
                '|',
                'bulletedList',
                'numberedList',
                'todoList',
                'outdent',
                'indent'
            ],
            shouldNotGroupWhenFull: false,
        },
        plugins: [
            Fullscreen,
            Alignment,
            Autoformat,
            AutoImage,
            AutoLink,
            Autosave,
            BalloonToolbar,
            BlockQuote,
            Bold,
            Bookmark,
            Code,
            CodeBlock,
            Essentials,
            FindAndReplace,
            FontBackgroundColor,
            FontColor,
            FontFamily,
            FontSize,
            FullPage,
            RubySupport,
            GeneralHtmlSupport,
            Heading,
            Highlight,
            HorizontalLine,
            HtmlComment,
            HtmlEmbed,
            ImageBlock,
            ImageCaption,
            ImageInline,
            ImageInsert,
            ImageInsertViaUrl,
            ImageResize,
            ImageStyle,
            ImageTextAlternative,
            ImageToolbar,
            ImageUpload,
            Indent,
            IndentBlock,
            Italic,
            Link,
            LinkImage,
            List,
            ListProperties,
            // Markdown,
            MediaEmbed,
            Mention,
            PageBreak,
            Paragraph,
            PasteFromMarkdownExperimental,
            PasteFromOffice,
            PictureEditing,
            RemoveFormat,
            ShowBlocks,
            SourceEditing,
            SpecialCharacters,
            SpecialCharactersArrows,
            SpecialCharactersCurrency,
            SpecialCharactersEssentials,
            SpecialCharactersLatin,
            SpecialCharactersMathematical,
            SpecialCharactersText,
            Strikethrough,
            Style,
            Subscript,
            Superscript,
            Table,
            TableCaption,
            TableCellProperties,
            TableColumnResize,
            TableProperties,
            TableToolbar,
            TextPartLanguage,
            TextTransformation,
            // Title,
            TodoList,
            Underline,
            WordCount,
        ],
        balloonToolbar: ['bold', 'italic', '|', 'link', 'insertImage', '|', 'bulletedList', 'numberedList'],
        extraPlugins: [
            createExportPdfPlugin(pageConfigRef),
            createMediaPropertiesPlugin(t),
            createPageSetupPlugin(t, pageConfigRef, setPageConfig),
            createFreePositionPlugin(t),
            ...extraPlugins
        ],
        mediaEmbed: {
            previewsInData: true,
            providers: [
                {
                    name: "youtube",
                    url: [
                        /^(?:m\.)?youtube\.com\/watch\?v=([\w-]+)(?:&t=(\d+))?/,
                        /^(?:m\.)?youtube\.com\/v\/([\w-]+)(?:\?t=(\d+))?/,
                        /^youtube\.com\/embed\/([\w-]+)(?:\?start=(\d+))?/,
                        /^youtu\.be\/([\w-]+)(?:\?t=(\d+))?/,
                        /^youtube\.com\/shorts\/([\w-]+)/,
                    ],
                    html: (match: any) => {
                        const id = match[1];
                        const time = match[2] ? `?start=${match[2]}` : '';
                        return (
                            '<div style="position: relative; padding-bottom: 56.25%; height: 0;">' +
                            `<iframe src="https://www.youtube.com/embed/${id}${time}" ` +
                            'style="position: absolute; width: 100%; height: 100%; left: 0; top: 0;" ' +
                            'frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>' +
                            '</div>'
                        );
                    },
                },
                {
                    name: "vimeo",
                    url: [
                        /^vimeo\.com\/(\d+)/,
                        /^vimeo\.com\/channels\/[\w]+\/(\d+)/,
                        /^vimeo\.com\/groups\/[\w]+\/videos\/(\d+)/,
                        /^player\.vimeo\.com\/video\/(\d+)/,
                    ],
                    html: (match: any) => {
                        const id = match[1];
                        return (
                            '<div style="position: relative; padding-bottom: 56.25%; height: 0;">' +
                            `<iframe src="https://player.vimeo.com/video/${id}" ` +
                            'style="position: absolute; width: 100%; height: 100%; left: 0; top: 0;" ' +
                            'frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>' +
                            '</div>'
                        );
                    },
                },
                {
                    name: "dailymotion",
                    url: [
                        /^dailymotion\.com\/video\/([\w]+)/,
                        /^dai\.ly\/([\w]+)/,
                    ],
                    html: (match: any) => {
                        const id = match[1];
                        return (
                            '<div style="position: relative; padding-bottom: 56.25%; height: 0;">' +
                            `<iframe src="https://www.dailymotion.com/embed/video/${id}" ` +
                            'style="position: absolute; width: 100%; height: 100%; left: 0; top: 0;" ' +
                            'frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>' +
                            '</div>'
                        );
                    },
                },
                {
                    name: "spotify",
                    url: [
                        /^open\.spotify\.com\/(track|album|playlist|episode|show)\/([\w]+)/,
                    ],
                    html: (match: any) => {
                        const type = match[1];
                        const id = match[2];
                        const height = (type === 'track') ? 80 : 380;
                        return (
                            `<div style="position: relative; height: ${height}px;">` +
                            `<iframe src="https://open.spotify.com/embed/${type}/${id}" ` +
                            'style="position: absolute; width: 100%; height: 100%; left: 0; top: 0;" ' +
                            'frameborder="0" allow="encrypted-media" allowtransparency="true"></iframe>' +
                            '</div>'
                        );
                    },
                },
                {
                    name: "twitter",
                    url: [
                        /^(?:twitter|x)\.com\/([\w]+)\/status\/(\d+)/,
                    ],
                    html: (match: any) => {
                        const user = match[1];
                        const id = match[2];
                        return (
                            '<div style="display: flex; justify-content: center;">' +
                            `<blockquote class="twitter-tweet"><a href="https://x.com/${user}/status/${id}"></a></blockquote>` +
                            '<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>' +
                            '</div>'
                        );
                    },
                },
                {
                    name: "instagram",
                    url: [
                        /^instagram\.com\/(?:p|reel)\/([\w-]+)/,
                    ],
                    html: (match: any) => {
                        const id = match[1];
                        return (
                            '<div style="display: flex; justify-content: center;">' +
                            `<iframe src="https://www.instagram.com/p/${id}/embed" ` +
                            'style="width: 400px; height: 480px; max-width: 100%; border: none;" ' +
                            'frameborder="0" scrolling="no" allowtransparency="true"></iframe>' +
                            '</div>'
                        );
                    },
                },
                {
                    name: "google-maps",
                    url: [
                        /^google\.com\/maps\/(?:place|embed|search|dir)\/([^\s]+)/,
                        /^goo\.gl\/maps\/([\w]+)/,
                        /^maps\.google\.com\/([^\s]+)/,
                        /^google\.com\/maps\?([^\s]+)/,
                    ],
                    html: (match: any) => {
                        const query = encodeURIComponent(match[0]);
                        return (
                            '<div style="position: relative; padding-bottom: 56.25%; height: 0;">' +
                            `<iframe src="https://maps.google.com/maps?q=${query}&output=embed" ` +
                            'style="position: absolute; width: 100%; height: 100%; left: 0; top: 0;" ' +
                            'frameborder="0" allowfullscreen></iframe>' +
                            '</div>'
                        );
                    },
                },
                {
                    name: "facebook-video",
                    url: [
                        /^facebook\.com\/(?:[\w.]+)\/videos\/(\d+)/,
                        /^fb\.watch\/([\w]+)/,
                    ],
                    html: (match: any) => {
                        const url = encodeURIComponent(`https://www.${match[0]}`);
                        return (
                            '<div style="position: relative; padding-bottom: 56.25%; height: 0;">' +
                            `<iframe src="https://www.facebook.com/plugins/video.php?href=${url}&show_text=false" ` +
                            'style="position: absolute; width: 100%; height: 100%; left: 0; top: 0; border: none; overflow: hidden;" ' +
                            'frameborder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>' +
                            '</div>'
                        );
                    },
                },
                {
                    name: "tiktok",
                    url: [
                        /^tiktok\.com\/@([\w.]+)\/video\/(\d+)/,
                    ],
                    html: (match: any) => {
                        const id = match[2];
                        return (
                            '<div style="display: flex; justify-content: center;">' +
                            `<iframe src="https://www.tiktok.com/embed/v2/${id}" ` +
                            'style="width: 325px; height: 580px; border: none;" ' +
                            'frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>' +
                            '</div>'
                        );
                    },
                },
                {
                    name: "soundcloud",
                    url: [
                        /^soundcloud\.com\/([\w-]+)\/([\w-]+)/,
                    ],
                    html: (match: any) => {
                        const url = encodeURIComponent(`https://${match[0]}`);
                        return (
                            '<div style="height: 166px;">' +
                            `<iframe src="https://w.soundcloud.com/player/?url=${url}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true" ` +
                            'style="width: 100%; height: 100%;" ' +
                            'frameborder="0" allow="autoplay" scrolling="no"></iframe>' +
                            '</div>'
                        );
                    },
                },
                {
                    name: "codepen",
                    url: [
                        /^codepen\.io\/([\w-]+)\/pen\/([\w]+)/,
                    ],
                    html: (match: any) => {
                        const user = match[1];
                        const id = match[2];
                        return (
                            '<div style="position: relative; padding-bottom: 56.25%; height: 0;">' +
                            `<iframe src="https://codepen.io/${user}/embed/${id}?default-tab=result" ` +
                            'style="position: absolute; width: 100%; height: 100%; left: 0; top: 0;" ' +
                            'frameborder="0" loading="lazy" allowtransparency="true" allowfullscreen></iframe>' +
                            '</div>'
                        );
                    },
                },
                {
                    // CDN links and any other URL - renders in a sandboxed iframe
                    name: "generic",
                    url: /^.+/,
                    html: (match: any) => {
                        const url = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
                        return (
                            '<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border: 1px solid #ccc; border-radius: 4px;">' +
                            `<iframe src="${url}" ` +
                            'style="position: absolute; width: 100%; height: 100%; left: 0; top: 0;" ' +
                            'frameborder="0" sandbox="allow-scripts allow-same-origin allow-popups" loading="lazy"></iframe>' +
                            '</div>'
                        );
                    },
                },
            ],
        },
        fontFamily: {
            options: ["Default", "Arial", "Courier New", "Inter", "Roboto", "Times New Roman", "Source Serif 4", "Poltawski Nowy", "Noto Sans JP"],
            supportAllValues: true
        },
        fontSize: {
            options: [10, 12, 14, 'default', 18, 20, 22, 24, 28, 32, 46, 56],
            supportAllValues: true,
        },
        fontColor: {
            columns: 6,
            colors: [
                {
                    color: 'var(--neutral-text-title-color)',
                    label: 'title'
                },
                {
                    color: 'var(--neutral-text-subtitle-color)',
                    label: 'subtitle'
                },
                {
                    color: 'var(--neutral-text-body-color)',
                    label: 'body'
                },
                {
                    color: 'var(--neutral-text-placeholder-color)',
                    label: 'placeholder'
                },
                {
                    color: 'var(--neutral-text-disabled-color)',
                    label: 'disabled'
                },
                {
                    color: 'var(--neutral-text-stable-color)',
                    label: 'stable'
                },
                {
                    color: '#287CF0',
                    label: 'primay'
                },
                {
                    color: '#FC7A1C',
                    label: 'warning'
                },
                {
                    color: '#3AAC6D',
                    label: 'success'
                },
                {
                    color: '#FAAD1E',
                    label: 'secondary3'
                },
                {
                    color: '#943CDD',
                    label: 'secondary5'
                },
            ],
        },
        // fontBackgroundColor: {
        //     columns: 6,
        //     colors: [],
        // },
        heading: {
            options: [
                {
                    model: 'paragraph',
                    title: 'Paragraph',
                    class: 'ck-heading_paragraph'
                },
                {
                    model: 'heading1',
                    view: 'h1',
                    title: 'Heading 1',
                    class: 'ck-heading_heading1'
                },
                {
                    model: 'heading2',
                    view: 'h2',
                    title: 'Heading 2',
                    class: 'ck-heading_heading2'
                },
                {
                    model: 'heading3',
                    view: 'h3',
                    title: 'Heading 3',
                    class: 'ck-heading_heading3'
                },
                {
                    model: 'heading4',
                    view: 'h4',
                    title: 'Heading 4',
                    class: 'ck-heading_heading4'
                },
                {
                    model: 'heading5',
                    view: 'h5',
                    title: 'Heading 5',
                    class: 'ck-heading_heading5'
                },
                {
                    model: 'heading6',
                    view: 'h6',
                    title: 'Heading 6',
                    class: 'ck-heading_heading6'
                }
            ]
        },
        htmlSupport: {
            allow: [
                {
                    name: /^.*$/,
                    styles: true,
                    attributes: true,
                    classes: true
                }
            ]
        },
        image: {
            toolbar: [
                'toggleImageCaption',
                'imageTextAlternative',
                '|',
                'imageStyle:inline',
                'imageStyle:wrapText',
                'imageStyle:breakText',
                '|',
                'resizeImage'
            ]
        },
        language: i18n.language,
        translations: i18n.language === 'vi' ? [translations] : undefined,
        licenseKey: LICENSE_KEY,
        link: {
            addTargetToExternalLinks: true,
            defaultProtocol: 'https://',
            decorators: {
                toggleDownloadable: {
                    mode: 'manual',
                    label: 'Downloadable',
                    attributes: {
                        download: 'file'
                    }
                }
            }
        },
        menuBar: { isVisible: props.menuBar },
        table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
        },
        ...props.customConfig,
        placeholder: props.placeholder,
    }), [extraPlugins.length, i18n.language, props.placeholder])

    useImperativeHandle(ref, () => ({
        element: editorContainerRef.current,
        editor: editorRef.current,
    }), [editorContainerRef.current, editorRef.current])

    return <div
        id={props.id}
        ref={editorContainerRef}
        className={`col editor-container editor-container_classic-editor editor-container_include-style ${props.className ?? ""} ${props.helperText?.length ? 'helper-text' : ""}`}
        helper-text={props.helperText}
        style={{ '--helper-text-color': props.helperTextColor ?? '#e14337', ...style } as CSSProperties}
    >
        <div className="editor-container__editor">
            <CKEditor
                ref={(r: any) => {
                    if (r) editorRef.current = r.editor
                }}
                onReady={(editor) => {
                    applyPageDimensions(editor, pageConfigRef.current);
                    props.onReady?.(editor);
                }}
                onAfterDestroy={props.onAfterDestroy}
                onFocus={props.onFocus}
                onChange={props.onChange}
                onBlur={props.onBlur}
                editor={ClassicEditor}
                onError={props.onError}
                config={editorConfig as any}
                disabled={props.disabled}
                data={props.value}
            />
        </div>
    </div>
})