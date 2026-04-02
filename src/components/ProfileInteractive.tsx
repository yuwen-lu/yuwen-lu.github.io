import ProfilePic from '../resources/images/me.png'

export const ProfileInteractive = () => {
  return (
    <div className="flex justify-center order-1 lg:order-2 lg:col-span-2 max-lg:-my-1">
      <img
        src={ProfilePic}
        alt="Yuwen Lu"
        className="w-40 h-40 sm:w-44 sm:h-44 md:w-60 md:h-60 lg:w-72 lg:h-72 object-cover rounded-full select-none"
        style={{
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))',
        }}
      />
    </div>
  )
}
