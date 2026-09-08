
import { useParams, useNavigate, useLocation, redirect as redirect1 } from 'react-router';
export const useRouter = () => {
    const push = useNavigate();
    return { push }
}

export const useSearchParams = () => {
    const get = (param) => {
        return useParams()[param];
    }
    return { get }
}

export const usePathname = () => {
    return useLocation().pathname;
}

export const redirect = (param) => {
    return redirect1(param);
}