import { useSelector, useDispatch } from 'react-redux'

//seharusnya jangan dibuat global seperti ini
const Button = ({ type = 'submit', className, ...props }) => {
    const is_page_readonly = useSelector(state => state.is_page_readonly)
    return (
        <>
            {is_page_readonly ? null : (
                <button
                    type={type}
                    className={`${className} inline-flex items-center py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150`}
                    {...props}
                />
            )}
        </>
    )
}

export default Button
