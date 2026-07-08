import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, type ScrollViewProps, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenScrollViewProps = ScrollViewProps & {
  children: ReactNode;
};

export function ScreenScrollView({
  children,
  contentContainerStyle,
  keyboardShouldPersistTaps = 'handled',
  showsVerticalScrollIndicator = false,
  ...props
}: ScreenScrollViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView className="flex-1 bg-[#F5FBF7]" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={[
          {
            flexGrow: 1,
            paddingTop: insets.top + 16,
            paddingBottom: Math.max(insets.bottom + 96, 120),
          },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        {...props}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
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
