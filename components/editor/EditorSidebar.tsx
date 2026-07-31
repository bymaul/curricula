import { SECTIONS } from '@/lib/consts';
import { CVData } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';
import { CheckCircle2, ChevronDown, Download, Printer, Sparkles, Upload } from 'lucide-react';
import { useState } from 'react';
import { AIAdjustDialog } from '../ai/AIAdjustDialog';
import { CertificationsForm } from '../forms/CertificationsForm';
import { EducationForm } from '../forms/EducationForm';
import { ExperienceForm } from '../forms/ExperienceForm';
import { PersonalForm } from '../forms/PersonalForm';
import { ProjectsForm } from '../forms/ProjectsForm';
import { SkillsForm } from '../forms/SkillsForm';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface EditorSidebarProps {
  className?: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportData: () => void;
  handlePrintClick: () => void;
  cvData: CVData;
  onApplyCVData: (data: CVData) => void;
}

export function EditorSidebar({
  className,
  fileInputRef,
  handleImportData,
  handleExportData,
  handlePrintClick,
  cvData,
  onApplyCVData,
}: EditorSidebarProps) {
  const { activeTab, setActiveTab } = useUIStore();
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);

  return (
    <section
      className={cn(
        'w-full lg:w-[35%] xl:w-[30%] flex-col border border-border bg-card rounded-xl shadow-lg overflow-hidden shrink-0 print:hidden',
        className,
      )}
    >
      <header className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/30 z-10">
        <h1 className="text-lg font-bold tracking-tight">Curricula</h1>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 lg:h-8 text-xs font-semibold gap-2 bg-background"
                  onClick={() => setIsAIDialogOpen(true)}
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  AI Adjust
                </Button>
              }
            />
            <TooltipContent>
              <p>Rewrite your CV to match a job description</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 lg:h-8 text-xs font-semibold gap-2 bg-background"
                >
                  {activeTab}
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56 p-1.5">
              {SECTIONS.map(({ name, icon: Icon }) => (
                <DropdownMenuItem
                  key={name}
                  onClick={() => setActiveTab(name)}
                  className="gap-3 py-2.5 px-3 text-sm cursor-pointer rounded-md"
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className={activeTab === name ? 'font-bold' : ''}>{name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full p-2">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6 pb-6">
            {activeTab === 'Personal' && <PersonalForm />}
            {activeTab === 'Experience' && <ExperienceForm />}
            {activeTab === 'Projects' && <ProjectsForm />}
            {activeTab === 'Education' && <EducationForm />}
            {activeTab === 'Skills' && <SkillsForm />}
            {activeTab === 'Certifications' && <CertificationsForm />}
          </form>
        </ScrollArea>
      </div>

      <footer className="px-5 py-4 border-t border-border bg-muted/30 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            Saved
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImportData}
            aria-label="Import CV data (JSON file)"
            className="hidden"
          />

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 lg:h-8 lg:w-8"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" />
                </Button>
              }
            />
            <TooltipContent>
              <p>Import JSON</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 lg:h-8 lg:w-8 mr-1"
                  onClick={handleExportData}
                >
                  <Download className="w-4 h-4" />
                </Button>
              }
            />
            <TooltipContent>
              <p>Export JSON</p>
            </TooltipContent>
          </Tooltip>

          <Button
            onClick={handlePrintClick}
            className="h-10 lg:h-8 text-xs font-bold gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </Button>
        </div>
      </footer>

      <AIAdjustDialog
        open={isAIDialogOpen}
        onOpenChange={setIsAIDialogOpen}
        cvData={cvData}
        onApply={onApplyCVData}
      />
    </section>
  );
}
