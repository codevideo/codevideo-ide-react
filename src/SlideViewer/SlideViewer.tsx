import React, { useEffect, useMemo } from 'react';
import { Marked } from 'marked';
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';
import { Box } from '@radix-ui/themes';
import { SLIDE_ID } from 'src/constants/CodeVideoDataIds';

const marked = new Marked(
    markedHighlight({
        async: false,
        emptyLangClass: 'hljs',
        langPrefix: 'hljs language-',
        highlight(code: any, lang: any, info: any) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        }
    })
);

marked.setOptions({
    gfm: true,
    breaks: false,
});

export interface SlideViewerProps {
    slideMarkdown: string;
    hljsTheme?: string;
    fontSize?: string;
    fontSizePx?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundSize?: string;
    padding?: string;
    maxWidth?: string;
    style?: React.CSSProperties;
}

export const SlideViewer: React.FC<SlideViewerProps> = ({
    slideMarkdown,
    hljsTheme = 'github',
    fontSize = '1rem',
    fontSizePx,
    fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI (Custom)", Roboto, "Helvetica Neue", "Open Sans (Custom)", system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
    color = 'black',
    backgroundColor = 'white',
    backgroundImage,
    backgroundSize = 'cover',
    padding = '2rem',
    maxWidth = '800px',
    style,
}) => {
    useEffect(() => {
        const themeId = 'hljs-theme-stylesheet';
        const existing = document.getElementById(themeId) as HTMLLinkElement | null;
        const version = hljs.versionString;  // e.g. "11.8.0"
        const href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/${version}/styles/${hljsTheme}.min.css`;

        if (existing) {
            existing.href = href;
        } else {
            const link = document.createElement('link');
            link.id = themeId;
            link.rel = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
        }

        // (Optional) cleanup if you really want to remove it on unmount:
        // return () => existing?.remove();
    }, [hljsTheme]);

    const html = useMemo(() => {
        const raw = marked.parse(slideMarkdown, { async: false });
        return DOMPurify.sanitize(raw);
    }, [slideMarkdown]);

    const slideContainerStyle: React.CSSProperties = {
        fontSize: fontSizePx ? `${fontSizePx}px` : fontSize,
        fontFamily,
        color,
        backgroundColor,
        padding,
        margin: '0 auto',
        ...(backgroundImage
            ? {
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
            }
            : {}),
        ...style,
    };

    const slideStyle: React.CSSProperties = {
        minWidth: maxWidth, // shim for now, could be better
        maxWidth,
    };


    return (
        <Box
            data-codevideo-id={SLIDE_ID}
            style={{ width: '100%', height: '100vh' }}>
            <Box style={{
                ...slideContainerStyle,
                height: '100%',
                width: '100%',
                display: 'flex',
                alignItems: 'start',
                justifyContent: 'center'
            }}>
                <Box style={slideStyle} dangerouslySetInnerHTML={{ __html: html }} />
            </Box>
        </Box>
    );
};
