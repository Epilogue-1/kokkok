import { useModal } from "@/hooks/useModal";
import { ListModal } from ".";
import { UserBlockModal } from "../DoubleButtonModal/UserBlockModal";
import { ReportModal } from "../ReportModal";

interface UserOptionsModalProps {
  reportedId: string;
}

export const UserOptionsModal: React.FC<UserOptionsModalProps> = ({
  reportedId,
}) => {
  const { openModal } = useModal();

  return (
    <ListModal
      position="bottom"
      buttons={[
        {
          text: "차단하기",
          onPress: async () => {
            openModal(
              <UserBlockModal blockedId={reportedId} isUserPage={true} />,
            );
          },
        },
        {
          text: "신고하기",
          onPress: async () => {
            openModal(
              <ReportModal reportedId={reportedId} isUserPage={true} />,
            );
          },
        },
      ]}
    />
  );
};
