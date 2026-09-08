

import Link from 'components/Link'
import { Menu } from '@headlessui/react'

const DropdownAction = ({ children, ...props }) => (
    <Menu.Item>
        {({ active }) => (
            <Link
                className={`a-dropdown-action w-full text-left block px-4 py-2 text-sm leading-5 text-gray-700 ${
                    active ? 'bg-gray-100' : ''
                } focus:outline-none transition duration-150 ease-in-out`}
                {...props}>
                {children}
            </Link>
        )}
    </Menu.Item>
)

export default DropdownAction