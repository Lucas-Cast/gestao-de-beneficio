import { Text, type TextProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';

export type ThemedTextType =
  | 'default'
  | 'title'
  | 'small'
  | 'smallBold'
  | 'subtitle'
  | 'link'
  | 'linkPrimary'
  | 'code';

export type ThemedTextProps = TextProps & {
  className?: string;
  type?: ThemedTextType;
  themeColor?: ThemeColor;
};

const textTypeClasses: Record<ThemedTextType, string> = {
  default: 'text-body',
  title: 'text-title',
  small: 'text-body-sm',
  smallBold: 'text-body-sm-bold',
  subtitle: 'text-subtitle',
  link: 'text-link',
  linkPrimary: 'text-link text-foreground',
  code: 'text-code font-mono',
};

const textColorClasses: Partial<Record<ThemeColor, string>> = {
  text: 'text-text',
  textOnBackground2: 'text-textOnBackground2',
  textSecondary: 'text-textSecondary',
  muted: 'text-muted',
  foreground: 'text-foreground',
  foregroundStrong: 'text-foregroundStrong',
};

export function ThemedText({
  className,
  style,
  type = 'default',
  themeColor = 'text',
  ...rest
}: ThemedTextProps) {
  const themeClassName = textColorClasses[themeColor] ?? 'text-text';

  return (
    <Text
      className={[themeClassName, textTypeClasses[type], className].filter(Boolean).join(' ')}
      style={style}
      {...rest}
    />
  );
}
