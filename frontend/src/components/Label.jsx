const Label = ({ className, children, ...props }) => (
    <label
        className={`${className} block font-medium text-sm text-gray-700 label-form-app bold`}
        {...props}>
        {children}
    </label>
)

export default Label
