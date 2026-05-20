import LegalPageLayout from '../components/LegalPageLayout';

const sections = [
  {
    title: '1. 문의 채널',
    body: (
      <>
        <p>출시 초기 지원은 이메일 기반으로 운영합니다. 기본 문의 채널은 noleji.ai@gmail.com 입니다.</p>
        <p>버그 제보, 계정 문제, 결제 문의, 데이터 삭제 요청은 동일 채널에서 접수할 수 있습니다.</p>
      </>
    ),
  },
  {
    title: '2. 문의 시 함께 보내주세요',
    body: (
      <>
        <ul className="list-disc pl-5">
          <li>사용한 플랫폼: Web / macOS Desktop / Mobile PWA</li>
          <li>문제가 발생한 계정 이메일 또는 UID</li>
          <li>발생 시각과 재현 단계</li>
          <li>오류 화면 캡처 또는 로그</li>
        </ul>
      </>
    ),
  },
  {
    title: '3. 응답 기준',
    body: (
      <>
        <p>출시 베타 단계에서는 영업일 기준 순차적으로 답변합니다. 계정 접근 불가, 결제 이슈, 데이터 손실 가능성은 우선 순위로 분류합니다.</p>
        <p>정식 SLA는 아직 제공하지 않으며, 운영 체계가 정식화되면 별도 공지합니다.</p>
      </>
    ),
  },
  {
    title: '4. 알려진 범위',
    body: (
      <>
        <p>모바일은 현재 PWA 베타 범위이며, 네이티브 앱스토어 앱이 아닙니다.</p>
        <p>유료 entitlement 반영은 운영 동기화 경로에 따라 즉시 반영되지 않을 수 있습니다.</p>
      </>
    ),
  },
];

export default function SupportPage() {
  return (
    <LegalPageLayout
      eyebrow="Support"
      title="지원 및 문의"
      summary="Noleji View 출시 초기 운영에서 필요한 기본 문의 채널, 응답 기준, 우선 처리 대상 이슈를 정리한 문서입니다. 정책/계정/결제/데이터 문의는 이 페이지를 기준으로 접수합니다."
      effectiveDate="2026-05-17"
      sections={sections}
    />
  );
}
