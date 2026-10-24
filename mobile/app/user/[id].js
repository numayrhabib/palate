import { useLocalSearchParams } from "expo-router";
import { ProfileBody } from "../../lib/profile";

export default function UserScreen() {
  const { id } = useLocalSearchParams();
  return <ProfileBody id={id} isMe={false} key={id} />;
}
