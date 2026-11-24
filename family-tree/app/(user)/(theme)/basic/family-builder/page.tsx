'use client'

import dynamic from 'next/dynamic'

const FamilyCanvas = dynamic(
  () => import('../../../../../components/FamilyCanvas'),
  { ssr: false }
)

export default function Page() {
  return (
    <main>
      <FamilyCanvas />
    </main>
  )
}
