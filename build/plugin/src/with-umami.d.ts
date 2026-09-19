import { ConfigPlugin } from '@expo/config-plugins';
export interface UmamiPluginProps {
    websiteId: string;
    hostUrl: string;
    disabled?: boolean;
    batchSize?: number;
    batchInterval?: number;
    persistEvents?: boolean;
    debug?: boolean;
}
declare const _default: ConfigPlugin<UmamiPluginProps>;
export default _default;
//# sourceMappingURL=with-umami.d.ts.map