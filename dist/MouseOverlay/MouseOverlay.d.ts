import { GUIMode, IPoint } from '@fullstackcraftllc/codevideo-types';
interface IMouseOverlayProps {
    mode: GUIMode;
    mousePosition: IPoint;
    mouseVisible: boolean;
}
export declare const MouseOverlay: (props: IMouseOverlayProps) => import("react/jsx-runtime").JSX.Element;
export {};
