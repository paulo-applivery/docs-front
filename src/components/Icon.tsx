import { Icon, addCollection } from '@iconify/react';
import type { CSSProperties } from 'react';
import { iconMap } from '../lib/icons';
import type { IconName } from '../lib/icons';

// Pre-load the Solar icon subset so @iconify/react resolves icons locally
// instead of fetching each one from api.iconify.design (avoids 429 rate limits)
import solarSubset from '../assets/solar-icons-subset.json';
addCollection(solarSubset as any);

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
