import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  SlidersHorizontal,
  User,
  FolderKanban,
  LogIn,
  Home,
  Bookmark,
} from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';

export function Navbar() {
  const location = useLocation();
  const isAuthenticated = Boolean(localStorage.getItem('mysurvey_jwt_token'));

  const isActive = (path: string) => location.pathname === path;
  const isMySurveysActive = isActive('/my-surveys') || isActive('/surveys/create');

  return (
    <>
      {/* Верхня панель (Десктоп + Мобільна шапка з логотипом та перемикачем тем) */}
      <header className="bg-card border-b border-line sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 text-lg sm:text-xl font-bold text-main shrink-0">
            <BarChart3 className="w-6 h-6 text-accent" />
            <span>MySurveyApp</span>
          </Link>

          {/* Десктопне меню */}
          <nav className="hidden md:flex items-center gap-2 text-sm">
            <Link
              to="/surveys"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition ${
                isActive('/surveys')
                  ? 'bg-accent text-accent-text'
                  : 'text-muted hover:text-main hover:bg-app'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Пройти опитування</span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/my-surveys"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition ${
                    isMySurveysActive
                      ? 'bg-accent text-accent-text'
                      : 'text-muted hover:text-main hover:bg-app'
                  }`}
                >
                  <FolderKanban className="w-4 h-4" />
                  <span>Мої опитування</span>
                </Link>
                <Link
                to="/bookmarks"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-main transition"
              >
                <Bookmark className="w-4 h-4" />
                <span>Відстежувані</span>
                
              </Link>
                <Link
                  to="/profile"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition ${
                    isActive('/profile')
                      ? 'bg-accent text-accent-text'
                      : 'text-muted hover:text-main hover:bg-app'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Профіль</span>
                </Link>
              </>
            ) : (
              <Link
                to="/auth"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition ${
                  isActive('/auth')
                    ? 'bg-accent text-accent-text'
                    : 'text-muted hover:text-main hover:bg-app'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Авторизація / Реєстрація</span>
              </Link>
            )}
          </nav>

          {/* Перемикач 3 колірних схем */}
          <ThemeSwitcher />
        </div>
      </header>

      {/* Нижня панель навігації для мобільних пристроїв */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-line px-2 py-1.5 flex justify-around items-center text-[11px]">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${
            isActive('/') ? 'text-accent font-semibold' : 'text-muted'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Головна</span>
        </Link>

        <Link
          to="/surveys"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${
            isActive('/surveys') ? 'text-accent font-semibold' : 'text-muted'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span>Опитування</span>
        </Link>

        {isAuthenticated ? (
          <>
            <Link
              to="/my-surveys"
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${
                isMySurveysActive ? 'text-accent font-semibold' : 'text-muted'
              }`}
            >
              <FolderKanban className="w-5 h-5" />
              <span>Мої</span>
            </Link>
            <Link
              to="/profile"
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${
                isActive('/profile') ? 'text-accent font-semibold' : 'text-muted'
              }`}
            >
              <User className="w-5 h-5" />
              <span>Профіль</span>
            </Link>
          </>
        ) : (
          <Link
            to="/auth"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${
              isActive('/auth') ? 'text-accent font-semibold' : 'text-muted'
            }`}
          >
            <LogIn className="w-5 h-5" />
            <span>Увійти</span>
          </Link>
        )}
      </nav>
    </>
  );
}