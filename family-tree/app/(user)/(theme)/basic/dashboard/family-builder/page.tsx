'use client'

import FamilyCanvas from '../../../../../../components/FamilyCanvas'

// import dynamic from 'next/dynamic'

// const FamilyCanvas = dynamic(
//   () => import('../../../../../../components/FamilyCanvas'),
//   { ssr: false }
// )

export default function Page() {
  return (
    <main>
      <FamilyCanvas />
    </main>
  )
}
