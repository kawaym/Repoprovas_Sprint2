import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  Link,
  TextField,
  Typography,
  Autocomplete,
} from "@mui/material";
import { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useAlert from "../hooks/useAlert";
import api, {
  Category,
  TeacherDisciplines,
  Test,
  TestByTeacher,
} from "../services/api";
import _ from "lodash";

function Instructors() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { setMessage } = useAlert();
  const [teachersDisciplines, setTeachersDisciplines] = useState<
    TestByTeacher[]
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function loadPage() {
      if (!token) return;

      const { data: testsData } = await api.getTestsByTeacher(token);
      setTeachersDisciplines(testsData.tests);
      const { data: categoriesData } = await api.getCategories(token);
      setCategories(categoriesData.categories);
    }
    loadPage();
  }, [token]);
  async function handleSearch(text: string) {
    try {
      if (!token) return;
      const query: string = text.length >= 2 ? text : "";
      const { data: testsData } = await api.getTestsByTeacher(token, query);
      setTeachersDisciplines(testsData.tests);
      const { data: categoriesData } = await api.getCategories(token);
      setCategories(categoriesData.categories);
    } catch (error: Error | AxiosError | any) {
      if (error.response) {
        setMessage({
          type: "error",
          text: error.response.data,
        });
        return;
      }
      setMessage({
        type: "error",
        text: "Erro, tente novamente em alguns segundos!",
      });
    }
  }
  const debouncedSearch = _.debounce(handleSearch, 250);

  return (
    <>
      <TextField
        sx={{ marginX: "auto", marginBottom: "25px", width: "450px" }}
        label="Pesquise por pessoa instrutora"
        onChange={(event) => debouncedSearch(event.target.value)}
        InputProps={{
          type: "search",
        }}
      />

      <Divider sx={{ marginBottom: "35px" }} />
      <Box
        sx={{
          marginX: "auto",
          width: "700px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate("/app/disciplinas")}
          >
            Disciplinas
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate("/app/pessoas-instrutoras")}
          >
            Pessoa Instrutora
          </Button>
          <Button variant="outlined" onClick={() => navigate("/app/adicionar")}>
            Adicionar
          </Button>
        </Box>
        <TeachersDisciplinesAccordions
          categories={categories}
          teachersDisciplines={teachersDisciplines}
        />
      </Box>
    </>
  );
}

interface TeachersDisciplinesAccordionsProps {
  teachersDisciplines: TestByTeacher[];
  categories: Category[];
}

function TeachersDisciplinesAccordions({
  categories,
  teachersDisciplines,
}: TeachersDisciplinesAccordionsProps) {
  const teachers = getUniqueTeachers(teachersDisciplines);

  return (
    <Box sx={{ marginTop: "50px" }}>
      {teachers.map((teacher) => (
        <Accordion sx={{ backgroundColor: "#FFF" }} key={teacher}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight="bold">{teacher}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {categories
              .filter(doesCategoryHaveTests(teacher, teachersDisciplines))
              .map((category) => (
                <Categories
                  key={category.id}
                  category={category}
                  teacher={teacher}
                  teachersDisciplines={teachersDisciplines}
                />
              ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

function getUniqueTeachers(teachersDisciplines: TestByTeacher[]) {
  return [
    ...new Set(
      teachersDisciplines.map(
        (teacherDiscipline) => teacherDiscipline.teacher.name
      )
    ),
  ];
}

function doesCategoryHaveTests(
  teacher: string,
  teachersDisciplines: TeacherDisciplines[]
) {
  return (category: Category) =>
    teachersDisciplines.filter(
      (teacherDiscipline) =>
        teacherDiscipline.teacher.name === teacher &&
        testOfThisCategory(teacherDiscipline, category)
    ).length > 0;
}

function testOfThisCategory(
  teacherDiscipline: TeacherDisciplines,
  category: Category
) {
  return teacherDiscipline.tests.some(
    (test) => test.category.id === category.id
  );
}

interface CategoriesProps {
  teachersDisciplines: TeacherDisciplines[];
  category: Category;
  teacher: string;
}

function Categories({
  category,
  teachersDisciplines,
  teacher,
}: CategoriesProps) {
  return (
    <>
      <Box sx={{ marginBottom: "8px" }}>
        <Typography fontWeight="bold">{category.name}</Typography>
        {teachersDisciplines
          .filter(
            (teacherDiscipline) => teacherDiscipline.teacher.name === teacher
          )
          .map((teacherDiscipline) => (
            <Tests
              key={teacherDiscipline.id}
              tests={teacherDiscipline.tests.filter(
                (test) => test.category.id === category.id
              )}
              disciplineName={teacherDiscipline.discipline.name}
            />
          ))}
      </Box>
    </>
  );
}

interface TestsProps {
  disciplineName: string;
  tests: Test[];
}

function Tests({ tests, disciplineName }: TestsProps) {
  const { token } = useAuth();
  const { setMessage } = useAlert();

  async function handleAddView(id: number) {
    try {
      if (!token) return;
      await api.addView(token, id);
    } catch (error: Error | AxiosError | any) {
      if (error.response) {
        setMessage({
          type: "error",
          text: error.response.data,
        });
        return;
      }
      setMessage({
        type: "error",
        text: "Erro, tente novamente em alguns segundos!",
      });
    }
  }
  return (
    <>
      {tests.map((test) => (
        <Typography
          key={test.id}
          color="#878787"
          sx={{ display: "flex", justifyContent: "space-between" }}
        >
          <Link
            href={test.pdfUrl}
            target="_blank"
            underline="none"
            color="inherit"
            onClick={() => handleAddView(test.id)}
          >{`${test.name} (${disciplineName})`}</Link>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography>{test.views}</Typography>
            <VisibilityIcon sx={{ marginLeft: "10px" }} />
          </Box>
        </Typography>
      ))}
    </>
  );
}

export default Instructors;
