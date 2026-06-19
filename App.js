import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";

import { C } from "./app/constants/colors";
import SpotsScreen from "./app/screens/SpotsScreen";
import MilesScreen from "./app/screens/MilesScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="My Miles"
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: C.surface,
            borderTopColor: C.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: C.accent,
          tabBarInactiveTintColor: C.muted,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "700",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          },
        }}
      >
        <Tab.Screen
          name="Spots"
          component={SpotsScreen}
          options={{
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>🍔</Text>,
          }}
        />
        <Tab.Screen
          name="My Miles"
          component={MilesScreen}
          options={{
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>🚗</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
