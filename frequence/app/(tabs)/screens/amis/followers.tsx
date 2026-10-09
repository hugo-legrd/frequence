import { useLocalSearchParams } from "expo-router";
import FollowListScreen from "../../../components/FollowListScreen";

export default function UserFollowers() {
  const { userId, name } = useLocalSearchParams<{ userId: string; name?: string }>();
  return (
    <FollowListScreen
      title="Abonnés"
      kind="followers"
      userId={userId}
      emptyText={`Personne ne suit ${name ?? 'cette personne'} pour l'instant.`}
    />
  ) ;
}