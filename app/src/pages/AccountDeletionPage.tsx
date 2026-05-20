import LegalPageLayout from '../components/LegalPageLayout';

const sections = [
  {
    title: '1. 삭제 요청 방법',
    body: (
      <>
        <p>계정 삭제 또는 워크스페이스 데이터 삭제를 원하면 noleji.ai@gmail.com 으로 요청해 주세요.</p>
        <p>제목에 "Noleji View 계정 삭제 요청" 또는 "Noleji View 데이터 삭제 요청"을 포함하면 처리 분류가 빨라집니다.</p>
      </>
    ),
  },
  {
    title: '2. 확인 절차',
    body: (
      <>
        <p>오삭제를 방지하기 위해 계정 소유 확인이 필요할 수 있습니다. 운영 측은 본인 확인을 위해 로그인 이메일, 최근 결제 정보, 최근 사용 기록 일부를 요청할 수 있습니다.</p>
      </>
    ),
  },
  {
    title: '3. 삭제 범위',
    body: (
      <>
        <ul className="list-disc pl-5">
          <li>계정 프로필 및 인증 연동 정보</li>
          <li>클라우드에 저장된 워크스페이스 스냅샷</li>
          <li>공유 링크 및 관련 메타데이터</li>
          <li>지원 처리에 꼭 필요하지 않은 운영 메모</li>
        </ul>
      </>
    ),
  },
  {
    title: '4. 예외 및 보관',
    body: (
      <>
        <p>결제 분쟁 대응, 법령 준수, 보안 사고 분석을 위해 필요한 최소 정보는 별도 보관될 수 있습니다.</p>
        <p>로컬 기기에 저장된 문서와 설정은 사용자가 직접 삭제해야 할 수 있습니다.</p>
      </>
    ),
  },
];

export default function AccountDeletionPage() {
  return (
    <LegalPageLayout
      eyebrow="Account Deletion"
      title="계정 삭제 및 데이터 삭제 안내"
      summary="Noleji View 계정 삭제, 클라우드 워크스페이스 삭제, 공유 데이터 정리 요청 시 필요한 절차와 확인 범위를 안내합니다. 출시 체크리스트에서 요구하는 삭제 경로를 명시하기 위한 문서입니다."
      effectiveDate="2026-05-17"
      sections={sections}
    />
  );
}
