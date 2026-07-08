import { useEffect, useState, type ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, type ScrollViewProps, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenScrollViewProps = ScrollViewProps & {
  children: ReactNode;
};

export function ScreenScrollView({
  children,
  contentContainerStyle,
  keyboardDismissMode = Platform.OS === 'ios' ? 'interactive' : 'on-drag',
  keyboardShouldPersistTaps = 'handled',
  showsVerticalScrollIndicator = false,
  ...props
}: ScreenScrollViewProps) {
  const insets = useSafeAreaInsets();
  const keyboardBottomPadding = useKeyboardBottomPadding();

  return (
    <KeyboardAvoidingView className="flex-1 bg-[#F5FBF7]" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={[
          {
            flexGrow: 1,
            paddingTop: insets.top + 16,
            paddingBottom: Math.max(insets.bottom + 96, 120) + keyboardBottomPadding,
          },
          contentContainerStyle,
        ]}
        keyboardDismissMode={keyboardDismissMode}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        {...props}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function useKeyboardBottomPadding(extra = 24) {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const mostrar = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (event) => {
      setKeyboardHeight(Math.max(0, event.endCoordinates.height - insets.bottom + extra));
    });
    const ocultar = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, [extra, insets.bottom]);

  return keyboardHeight;
}

export function ScreenTopView({ children, style, ...props }: ViewProps & { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View className="px-5" style={[{ paddingTop: insets.top + 16 }, style]} {...props}>
      {children}
    </View>
  );
}
