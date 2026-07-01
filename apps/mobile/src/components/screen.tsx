import { type ReactNode } from 'react';
import { ScrollView, type ScrollViewProps, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenScrollViewProps = ScrollViewProps & {
  children: ReactNode;
};

export function ScreenScrollView({ children, contentContainerStyle, ...props }: ScreenScrollViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-marca-fondo px-5"
      contentContainerStyle={[{ paddingTop: insets.top + 16 }, contentContainerStyle]}
      {...props}
    >
      {children}
    </ScrollView>
  );
}

export function ScreenTopView({ children, style, ...props }: ViewProps & { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View className="px-5" style={[{ paddingTop: insets.top + 16 }, style]} {...props}>
      {children}
    </View>
  );
}
