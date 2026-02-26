import { Icon, addCollection, addIcon } from '@iconify/react';
import type { CSSProperties } from 'react';
import { iconMap } from '../lib/icons';
import type { IconName } from '../lib/icons';

// Pre-load the Solar icon subset so @iconify/react resolves icons locally
// instead of fetching each one from api.iconify.design (avoids 429 rate limits)
import solarSubset from '../assets/solar-icons-subset.json';
addCollection(solarSubset as any);

// Custom brand icons (Hugeicons stroke-rounded style)
addIcon('custom:apple-logo', {
  body: '<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 5.75C12 3.75 13.5 1.75 15.5 1.75C15.5 3.75 14 5.75 12 5.75Z"/><path d="M12.5 8.09001C11.9851 8.09001 11.5867 7.92646 11.1414 7.74368C10.5776 7.51225 9.93875 7.25 8.89334 7.25C7.02235 7.25 4 8.74945 4 12.7495C4 17.4016 7.10471 22.25 9.10471 22.25C9.77426 22.25 10.3775 21.9871 10.954 21.7359C11.4815 21.5059 11.9868 21.2857 12.5 21.2857C13.0132 21.2857 13.5185 21.5059 14.046 21.7359C14.6225 21.9871 15.2257 22.25 15.8953 22.25C17.2879 22.25 18.9573 19.8992 20 16.9008C18.3793 16.2202 17.338 14.618 17.338 12.75C17.338 11.121 18.2036 10.0398 19.5 9.25C18.5 7.75 17.0134 7.25 15.9447 7.25C14.8993 7.25 14.2604 7.51225 13.6966 7.74368C13.2514 7.92646 13.0149 8.09001 12.5 8.09001Z"/></g>',
  width: 24, height: 24,
});
addIcon('custom:apple-finder', {
  body: '<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z"/><path d="M7 8V10"/><path d="M17 8V10"/><path d="M7 16.5C10.5 18.5 13.5 18.5 17 16.5"/><path d="M12.9896 2.5C12.1238 3.78525 10.5163 7.71349 10.0737 11.5798C9.98097 12.3899 9.9346 12.795 10.1905 13.1176C10.2151 13.1486 10.2474 13.1843 10.2757 13.212C10.5708 13.5 11.0149 13.5 11.9031 13.5C12.3889 13.5 12.6317 13.5 12.7766 13.6314C12.7923 13.6457 12.8051 13.6588 12.819 13.6748C12.9468 13.8225 12.9383 14.072 12.9212 14.5709C12.8685 16.1156 12.9401 19.0524 14 21.5"/></g>',
  width: 24, height: 24,
});
addIcon('custom:windows-logo', {
  body: '<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.0136 3.99538L8.01361 4.99036C5.61912 5.38744 4.42188 5.58597 3.71094 6.421C3 7.25602 3 8.46368 3 10.879L3 13.121C3 15.5363 3 16.744 3.71094 17.579C4.42188 18.414 5.61913 18.6126 8.01361 19.0096L14.0136 20.0046C17.2567 20.5424 18.8782 20.8113 19.9391 19.9171C21 19.023 21 17.3873 21 14.116V9.88402C21 6.6127 21 4.97704 19.9391 4.08286C18.8782 3.18868 17.2567 3.45758 14.0136 3.99538Z"/><path d="M11 4.5V19.5M3 12H21"/></g>',
  width: 24, height: 24,
});
addIcon('custom:android-robot', {
  body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6.5 9.5C6.5 6.46243 8.96243 4 12 4C15.0376 4 17.5 6.46243 17.5 9.5V16C17.5 17.4142 17.5 18.1213 17.0607 18.5607C16.6213 19 15.9142 19 14.5 19H9.5C8.08579 19 7.37868 19 6.93934 18.5607C6.5 18.1213 6.5 17.4142 6.5 16V9.5Z"/><path d="M20 11V17"/><path d="M15 19V22"/><path d="M9 19V22"/><path d="M4 11V17"/><path d="M10 4L8.5 2M14 4L15.5 2"/><path d="M6.5 10H17.5"/></g>',
  width: 24, height: 24,
});

type Props = {
  name: IconName;
  className?: string;
  width?: string | number;
  height?: string | number;
  inline?: boolean;
  'aria-hidden'?: boolean;
  'aria-label'?: string;
  style?: CSSProperties;
};

export default function AppIcon({ name, className, ...props }: Props) {
  const icon = iconMap[name];
  if (!icon) return null;
  return <Icon icon={icon} className={className} {...props} />;
}
