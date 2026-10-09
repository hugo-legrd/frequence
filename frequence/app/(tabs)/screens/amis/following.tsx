import { useLocalSearchParams } from "expo-router";
import FollowListScreen from "../../../../lib/components/FollowListScreen";

export default function UserFollowers() {
  const { userId, name } = useLocalSearchParams<{ userId: string; name?: string }>();
  return (
    <FollowListScreen
      title="Abonnements"
      kind="following"
      userId={userId}
      emptyText={`${name} ne suit personne pour l'instant.`}
    />
  ) ;
}